import 'package:flutter/foundation.dart';

@immutable
class AuthState {
  const AuthState({required this.isLoggedIn, this.userName, this.userEmail});

  const AuthState.loggedOut()
    : isLoggedIn = false,
      userName = null,
      userEmail = null;

  final bool isLoggedIn;
  final String? userName;
  final String? userEmail;
}

class AuthNotifier extends ValueNotifier<AuthState> {
  AuthNotifier() : super(const AuthState.loggedOut());

  bool get isLoggedIn => value.isLoggedIn;

  String? get userName => value.userName;

  String? get userEmail => value.userEmail;

  void login(String email, String password) {
    final normalizedEmail = email.trim();
    final emailName = normalizedEmail.split('@').first;
    final displayName = emailName.isEmpty
        ? 'Pelanggan Seli'
        : '${emailName[0].toUpperCase()}${emailName.substring(1)}';

    value = AuthState(
      isLoggedIn: true,
      userName: displayName,
      userEmail: normalizedEmail,
    );
  }

  void register(String name, String email, String phone, String password) {
    value = AuthState(
      isLoggedIn: true,
      userName: name.trim(),
      userEmail: email.trim(),
    );
  }

  void logout() {
    value = const AuthState.loggedOut();
  }
}

final authNotifier = AuthNotifier();
