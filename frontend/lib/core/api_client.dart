import 'dart:async';

import 'package:dio/dio.dart';
import 'package:florist_frontend/core/network/credential_adapter_stub.dart'
    if (dart.library.html) 'package:florist_frontend/core/network/credential_adapter_web.dart';

const apiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'http://localhost:3000/api',
);

class ApiException implements Exception {
  const ApiException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  @override
  String toString() => message;

  static ApiException from(Object error) {
    if (error is ApiException) return error;
    if (error is DioException) {
      final status = error.response?.statusCode;
      final body = error.response?.data;
      String? serverMessage;
      if (body is Map) {
        final value = body['message'];
        if (value is String && value.trim().isNotEmpty) {
          serverMessage = value.trim();
        }
        final errors = body['errors'];
        if (serverMessage == 'Input validation failed' &&
            errors is List &&
            errors.isNotEmpty) {
          serverMessage = errors.first.toString();
        }
      }

      if (status == 401) {
        return ApiException(
          serverMessage == 'Invalid email or password'
              ? 'Email atau password salah.'
              : 'Sesi atau kredensial tidak valid. Silakan masuk kembali.',
          statusCode: status,
        );
      }
      if (status == 409) {
        return ApiException(
          serverMessage ?? 'Data tersebut sudah digunakan.',
          statusCode: status,
        );
      }
      if (status != null) {
        return ApiException(
          serverMessage == 'Email is already registered'
              ? 'Email tersebut sudah terdaftar.'
              : serverMessage ?? 'Permintaan tidak dapat diproses.',
          statusCode: status,
        );
      }
      if (error.type == DioExceptionType.connectionError ||
          error.type == DioExceptionType.connectionTimeout ||
          error.type == DioExceptionType.receiveTimeout ||
          error.type == DioExceptionType.sendTimeout) {
        return const ApiException(
          'Tidak dapat terhubung ke server. Pastikan backend sedang berjalan.',
        );
      }
    }
    return const ApiException('Terjadi kesalahan. Silakan coba lagi.');
  }
}

class AccessTokenStore {
  String? _accessToken;

  String? get accessToken => _accessToken;

  void set(String token) => _accessToken = token;

  void clear() => _accessToken = null;
}

class ApiClient {
  ApiClient({Dio? dio, AccessTokenStore? tokenStore})
    : tokenStore = tokenStore ?? AccessTokenStore(),
      dio = dio ?? _createDio() {
    _refreshDio = _createDio();
    this.dio.interceptors.add(
      QueuedInterceptorsWrapper(
        onRequest: _authorize,
        onError: _recoverUnauthorized,
      ),
    );
  }

  final Dio dio;
  final AccessTokenStore tokenStore;
  late final Dio _refreshDio;
  Future<String?>? _refreshing;
  void Function()? onSessionExpired;

  static Dio _createDio() {
    final dio = Dio(
      BaseOptions(
        baseUrl: apiBaseUrl,
        contentType: Headers.jsonContentType,
        responseType: ResponseType.json,
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 15),
        sendTimeout: const Duration(seconds: 15),
        headers: const {'Accept': Headers.jsonContentType},
      ),
    );
    enableCredentialCookies(dio);
    return dio;
  }

  void _authorize(RequestOptions options, RequestInterceptorHandler handler) {
    final token = tokenStore.accessToken;
    if (token != null && options.extra['skipAuth'] != true) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  Future<void> _recoverUnauthorized(
    DioException error,
    ErrorInterceptorHandler handler,
  ) async {
    final request = error.requestOptions;
    final isAuthEndpoint =
        request.path.contains('/auth/login') ||
        request.path.contains('/auth/register') ||
        request.path.contains('/auth/refresh-token');
    if (error.response?.statusCode != 401 ||
        request.extra['retriedAfterRefresh'] == true ||
        request.extra['skipAuthRefresh'] == true ||
        isAuthEndpoint) {
      handler.next(error);
      return;
    }

    try {
      final token = await _refreshAccessToken();
      if (token == null) {
        handler.next(error);
        return;
      }
      request.headers['Authorization'] = 'Bearer $token';
      request.extra['retriedAfterRefresh'] = true;
      handler.resolve(await dio.fetch<dynamic>(request));
    } catch (_) {
      tokenStore.clear();
      onSessionExpired?.call();
      handler.next(error);
    }
  }

  Future<String?> _refreshAccessToken() {
    final active = _refreshing;
    if (active != null) return active;
    final future = _performRefresh();
    _refreshing = future;
    return future.whenComplete(() => _refreshing = null);
  }

  Future<String?> _performRefresh() async {
    final response = await _refreshDio.post<Map<String, dynamic>>(
      '/auth/refresh-token',
      options: Options(extra: const {'skipAuth': true}),
    );
    final data = _responseData(response.data);
    final token = data['accessToken'];
    if (token is! String || token.isEmpty) return null;
    tokenStore.set(token);
    return token;
  }
}

Map<String, dynamic> responseData(Object? body) {
  if (body is Map<String, dynamic>) return _responseData(body);
  if (body is Map) {
    return _responseData(Map<String, dynamic>.from(body));
  }
  throw const ApiException('Respons server tidak valid.');
}

Map<String, dynamic> _responseData(Map<String, dynamic>? body) {
  final data = body?['data'];
  if (data is Map<String, dynamic>) return data;
  if (data is Map) return Map<String, dynamic>.from(data);
  throw const ApiException('Respons server tidak valid.');
}

final apiClient = ApiClient();
