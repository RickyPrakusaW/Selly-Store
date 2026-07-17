import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:florist_frontend/core/api_client.dart';

@immutable
class AuthUser {
  const AuthUser({
    required this.id,
    required this.email,
    required this.fullName,
    required this.role,
    required this.isVerified,
    this.phoneNumber,
  });

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    return AuthUser(
      id: json['id']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      fullName: json['fullName']?.toString() ?? 'Pelanggan Seli',
      phoneNumber: json['phoneNumber']?.toString(),
      role: json['role']?.toString().toLowerCase() ?? 'customer',
      isVerified: json['isVerified'] == true,
    );
  }

  final String id;
  final String email;
  final String fullName;
  final String? phoneNumber;
  final String role;
  final bool isVerified;
}

@immutable
class AuthState {
  const AuthState({this.user, this.isLoading = false});

  const AuthState.loggedOut({this.isLoading = false}) : user = null;

  final AuthUser? user;
  final bool isLoading;

  bool get isLoggedIn => user != null;
  String? get userName => user?.fullName;
  String? get userEmail => user?.email;
}

class AuthSession {
  const AuthSession({required this.accessToken, required this.user});

  final String accessToken;
  final AuthUser user;
}

abstract interface class AuthGateway {
  Future<AuthSession> login(String email, String password);
  Future<String> register(
    String name,
    String email,
    String phone,
    String password,
  );
  Future<String> refresh();
  Future<AuthUser> me();
  Future<void> logout();
}

class DioAuthGateway implements AuthGateway {
  DioAuthGateway(this._dio);

  final Dio _dio;

  @override
  Future<AuthSession> login(String email, String password) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/auth/login',
        data: {'email': email.trim().toLowerCase(), 'password': password},
        options: Options(extra: const {'skipAuth': true}),
      );
      final payload = responseData(response.data);
      final token = payload['accessToken'];
      final user = payload['user'];
      if (token is! String || user is! Map) {
        throw const ApiException('Respons login tidak valid.');
      }
      return AuthSession(
        accessToken: token,
        user: AuthUser.fromJson(Map<String, dynamic>.from(user)),
      );
    } catch (error) {
      throw ApiException.from(error);
    }
  }

  @override
  Future<String> register(
    String name,
    String email,
    String phone,
    String password,
  ) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/auth/register',
        data: {
          'email': email.trim().toLowerCase(),
          'password': password,
          'fullName': name.trim(),
          'phoneNumber': _normalizePhone(phone),
        },
        options: Options(extra: const {'skipAuth': true}),
      );
      return response.data?['message']?.toString() ??
          'Pendaftaran berhasil. Silakan verifikasi email Anda.';
    } catch (error) {
      throw ApiException.from(error);
    }
  }

  @override
  Future<String> refresh() async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/auth/refresh-token',
        options: Options(
          extra: const {'skipAuth': true, 'skipAuthRefresh': true},
        ),
      );
      final token = responseData(response.data)['accessToken'];
      if (token is! String || token.isEmpty) {
        throw const ApiException('Respons refresh token tidak valid.');
      }
      return token;
    } catch (error) {
      throw ApiException.from(error);
    }
  }

  @override
  Future<AuthUser> me() async {
    try {
      final response = await _dio.get<Map<String, dynamic>>('/auth/me');
      return AuthUser.fromJson(responseData(response.data));
    } catch (error) {
      throw ApiException.from(error);
    }
  }

  @override
  Future<void> logout() async {
    try {
      await _dio.post<Map<String, dynamic>>(
        '/auth/logout',
        options: Options(extra: const {'skipAuthRefresh': true}),
      );
    } catch (error) {
      throw ApiException.from(error);
    }
  }

  static String _normalizePhone(String value) {
    final phone = value.replaceAll(RegExp(r'[\s()-]'), '');
    if (phone.startsWith('0')) return '+62${phone.substring(1)}';
    if (phone.startsWith('62')) return '+$phone';
    return phone;
  }
}

class AuthNotifier extends ValueNotifier<AuthState> {
  AuthNotifier({AuthGateway? gateway, bool bindSessionExpiry = false})
    : _gateway = gateway ?? DioAuthGateway(apiClient.dio),
      super(const AuthState.loggedOut()) {
    if (bindSessionExpiry) apiClient.onSessionExpired = _clearSession;
  }

  AuthGateway _gateway;

  bool get isLoggedIn => value.isLoggedIn;
  String? get userName => value.userName;
  String? get userEmail => value.userEmail;

  Future<void> login(String email, String password) async {
    value = AuthState(user: value.user, isLoading: true);
    try {
      final session = await _gateway.login(email, password);
      apiClient.tokenStore.set(session.accessToken);
      value = AuthState(user: session.user);
    } catch (error) {
      value = const AuthState.loggedOut();
      throw ApiException.from(error);
    }
  }

  Future<String> register(
    String name,
    String email,
    String phone,
    String password,
  ) async {
    value = AuthState(user: value.user, isLoading: true);
    try {
      final message = await _gateway.register(name, email, phone, password);
      final session = await _gateway.login(email, password);
      apiClient.tokenStore.set(session.accessToken);
      value = AuthState(user: session.user);
      return message;
    } catch (error) {
      value = const AuthState.loggedOut();
      throw ApiException.from(error);
    }
  }

  Future<void> restoreSession() async {
    if (isLoggedIn) return;
    try {
      final token = await _gateway.refresh();
      apiClient.tokenStore.set(token);
      final user = await _gateway.me();
      value = AuthState(user: user);
    } catch (_) {
      _clearSession();
    }
  }

  Future<void> logout() async {
    Object? failure;
    try {
      await _gateway.logout();
    } catch (error) {
      failure = error;
    } finally {
      _clearSession();
    }
    if (failure != null) throw ApiException.from(failure);
  }

  void _clearSession() {
    apiClient.tokenStore.clear();
    value = const AuthState.loggedOut();
  }

  @visibleForTesting
  void configureForTesting(AuthGateway gateway) {
    _gateway = gateway;
    _clearSession();
  }
}

final authNotifier = AuthNotifier(bindSessionExpiry: true);
