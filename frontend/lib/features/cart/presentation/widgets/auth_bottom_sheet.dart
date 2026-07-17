import 'package:flutter/material.dart';
import 'package:florist_frontend/core/api_client.dart';
import 'package:florist_frontend/core/auth_state.dart';
import 'package:florist_frontend/core/theme.dart';
import 'package:lucide_flutter/lucide_flutter.dart';

enum _AuthMode { login, register }

class AuthBottomSheet extends StatefulWidget {
  const AuthBottomSheet({super.key});

  @override
  State<AuthBottomSheet> createState() => _AuthBottomSheetState();
}

class _AuthBottomSheetState extends State<AuthBottomSheet> {
  final _loginFormKey = GlobalKey<FormState>();
  final _registerFormKey = GlobalKey<FormState>();
  final _loginEmailController = TextEditingController();
  final _loginPasswordController = TextEditingController();
  final _nameController = TextEditingController();
  final _registerEmailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _registerPasswordController = TextEditingController();

  var _mode = _AuthMode.login;
  var _obscureLoginPassword = true;
  var _obscureRegisterPassword = true;
  var _isSubmitting = false;

  @override
  void dispose() {
    _loginEmailController.dispose();
    _loginPasswordController.dispose();
    _nameController.dispose();
    _registerEmailController.dispose();
    _phoneController.dispose();
    _registerPasswordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.viewInsetsOf(context).bottom,
        ),
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 520),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: AppColors.lightGray,
                        borderRadius: BorderRadius.circular(999),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  Row(
                    children: [
                      Container(
                        width: 48,
                        height: 48,
                        decoration: const BoxDecoration(
                          color: AppColors.blushRose,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          LucideIcons.flower2,
                          color: AppColors.deepRose,
                          size: 24,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Selangkah lagi',
                              style: Theme.of(context).textTheme.displaySmall,
                            ),
                            Text(
                              'Masuk untuk melanjutkan pesananmu.',
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        tooltip: 'Tutup',
                        onPressed: () => Navigator.pop(context, false),
                        icon: const Icon(LucideIcons.x),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: AppColors.offWhite,
                      borderRadius: BorderRadius.circular(999),
                      border: Border.all(color: AppColors.blushRose),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: _AuthTab(
                            label: 'Masuk',
                            icon: LucideIcons.logIn,
                            selected: _mode == _AuthMode.login,
                            onPressed: () {
                              setState(() => _mode = _AuthMode.login);
                            },
                          ),
                        ),
                        Expanded(
                          child: _AuthTab(
                            label: 'Daftar Baru',
                            icon: LucideIcons.userPlus,
                            selected: _mode == _AuthMode.register,
                            onPressed: () {
                              setState(() => _mode = _AuthMode.register);
                            },
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                  AnimatedSwitcher(
                    duration: const Duration(milliseconds: 250),
                    switchInCurve: Curves.easeOut,
                    switchOutCurve: Curves.easeIn,
                    transitionBuilder: (child, animation) {
                      final slide = Tween<Offset>(
                        begin: const Offset(0.04, 0),
                        end: Offset.zero,
                      ).animate(animation);
                      return FadeTransition(
                        opacity: animation,
                        child: SlideTransition(position: slide, child: child),
                      );
                    },
                    child: _mode == _AuthMode.login
                        ? _buildLoginForm(context)
                        : _buildRegisterForm(context),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLoginForm(BuildContext context) {
    return Form(
      key: _loginFormKey,
      child: Column(
        key: const ValueKey('login-form'),
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TextFormField(
            key: const ValueKey('login-email'),
            controller: _loginEmailController,
            keyboardType: TextInputType.emailAddress,
            autofillHints: const [AutofillHints.email],
            validator: _validateEmail,
            decoration: const InputDecoration(
              labelText: 'Email',
              hintText: 'nama@email.com',
              prefixIcon: Icon(LucideIcons.mail),
            ),
          ),
          const SizedBox(height: 14),
          TextFormField(
            key: const ValueKey('login-password'),
            controller: _loginPasswordController,
            obscureText: _obscureLoginPassword,
            autofillHints: const [AutofillHints.password],
            validator: (value) => _validateRequired(value, 'Password'),
            decoration: InputDecoration(
              labelText: 'Password',
              hintText: 'Masukkan password akun',
              prefixIcon: const Icon(LucideIcons.lockKeyhole),
              suffixIcon: IconButton(
                tooltip: _obscureLoginPassword
                    ? 'Tampilkan password'
                    : 'Sembunyikan password',
                onPressed: () {
                  setState(
                    () => _obscureLoginPassword = !_obscureLoginPassword,
                  );
                },
                icon: Icon(
                  _obscureLoginPassword ? LucideIcons.eye : LucideIcons.eyeOff,
                ),
              ),
            ),
          ),
          const SizedBox(height: 20),
          FilledButton.icon(
            key: const ValueKey('submit-login'),
            onPressed: _isSubmitting ? null : _submitLogin,
            icon: _isSubmitting
                ? const SizedBox.square(
                    dimension: 18,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: AppColors.pureWhite,
                    ),
                  )
                : const Icon(LucideIcons.logIn, size: 19),
            label: Text(_isSubmitting ? 'Memproses...' : 'Masuk'),
            style: FilledButton.styleFrom(
              minimumSize: const Size.fromHeight(52),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRegisterForm(BuildContext context) {
    return Form(
      key: _registerFormKey,
      child: Column(
        key: const ValueKey('register-form'),
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TextFormField(
            key: const ValueKey('register-name'),
            controller: _nameController,
            textCapitalization: TextCapitalization.words,
            autofillHints: const [AutofillHints.name],
            validator: (value) => _validateRequired(value, 'Nama lengkap'),
            decoration: const InputDecoration(
              labelText: 'Nama Lengkap',
              hintText: 'Nama lengkapmu',
              prefixIcon: Icon(LucideIcons.userRound),
            ),
          ),
          const SizedBox(height: 14),
          TextFormField(
            key: const ValueKey('register-email'),
            controller: _registerEmailController,
            keyboardType: TextInputType.emailAddress,
            autofillHints: const [AutofillHints.email],
            validator: _validateEmail,
            decoration: const InputDecoration(
              labelText: 'Email',
              hintText: 'nama@email.com',
              prefixIcon: Icon(LucideIcons.mail),
            ),
          ),
          const SizedBox(height: 14),
          TextFormField(
            key: const ValueKey('register-phone'),
            controller: _phoneController,
            keyboardType: TextInputType.phone,
            autofillHints: const [AutofillHints.telephoneNumber],
            validator: _validatePhone,
            decoration: const InputDecoration(
              labelText: 'Nomor WA',
              hintText: '08xxxxxxxxxx',
              prefixIcon: Icon(LucideIcons.phone),
            ),
          ),
          const SizedBox(height: 14),
          TextFormField(
            key: const ValueKey('register-password'),
            controller: _registerPasswordController,
            obscureText: _obscureRegisterPassword,
            autofillHints: const [AutofillHints.newPassword],
            validator: _validatePassword,
            decoration: InputDecoration(
              labelText: 'Password',
              hintText: 'Minimal 10 karakter, huruf besar & angka',
              prefixIcon: const Icon(LucideIcons.lockKeyhole),
              suffixIcon: IconButton(
                tooltip: _obscureRegisterPassword
                    ? 'Tampilkan password'
                    : 'Sembunyikan password',
                onPressed: () {
                  setState(
                    () => _obscureRegisterPassword = !_obscureRegisterPassword,
                  );
                },
                icon: Icon(
                  _obscureRegisterPassword
                      ? LucideIcons.eye
                      : LucideIcons.eyeOff,
                ),
              ),
            ),
          ),
          const SizedBox(height: 20),
          FilledButton.icon(
            key: const ValueKey('submit-register'),
            onPressed: _isSubmitting ? null : _submitRegister,
            icon: _isSubmitting
                ? const SizedBox.square(
                    dimension: 18,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: AppColors.pureWhite,
                    ),
                  )
                : const Icon(LucideIcons.userPlus, size: 19),
            label: Text(_isSubmitting ? 'Memproses...' : 'Daftar Akun'),
            style: FilledButton.styleFrom(
              minimumSize: const Size.fromHeight(52),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _submitLogin() async {
    if (!(_loginFormKey.currentState?.validate() ?? false)) {
      return;
    }
    setState(() => _isSubmitting = true);
    try {
      await authNotifier.login(
        _loginEmailController.text,
        _loginPasswordController.text,
      );
      if (!mounted) return;
      Navigator.pop(context, true);
    } catch (error) {
      if (!mounted) return;
      _showError(ApiException.from(error).message);
      setState(() => _isSubmitting = false);
    }
  }

  Future<void> _submitRegister() async {
    if (!(_registerFormKey.currentState?.validate() ?? false)) {
      return;
    }
    setState(() => _isSubmitting = true);
    try {
      await authNotifier.register(
        _nameController.text,
        _registerEmailController.text,
        _phoneController.text,
        _registerPasswordController.text,
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(
          const SnackBar(
            content: Text(
              'Pendaftaran berhasil. Silakan cek email untuk verifikasi akun.',
            ),
            behavior: SnackBarBehavior.floating,
          ),
        );
      Navigator.pop(context, true);
    } catch (error) {
      if (!mounted) return;
      _showError(ApiException.from(error).message);
      setState(() => _isSubmitting = false);
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          content: Text(message),
          behavior: SnackBarBehavior.floating,
          backgroundColor: AppColors.error,
        ),
      );
  }

  String? _validateRequired(String? value, String label) {
    if (value == null || value.trim().isEmpty) {
      return '$label wajib diisi';
    }
    return null;
  }

  String? _validateEmail(String? value) {
    final requiredError = _validateRequired(value, 'Email');
    if (requiredError != null) {
      return requiredError;
    }
    if (!value!.contains('@') || !value.contains('.')) {
      return 'Format email tidak valid';
    }
    return null;
  }

  String? _validatePhone(String? value) {
    final requiredError = _validateRequired(value, 'Nomor WA');
    if (requiredError != null) return requiredError;
    final digits = value!.replaceAll(RegExp(r'\D'), '');
    if (digits.length < 8 || digits.length > 15) {
      return 'Nomor WA tidak valid';
    }
    return null;
  }

  String? _validatePassword(String? value) {
    final requiredError = _validateRequired(value, 'Password');
    if (requiredError != null) {
      return requiredError;
    }
    if (value!.length < 10) {
      return 'Password minimal 10 karakter';
    }
    if (!RegExp(r'[A-Z]').hasMatch(value) ||
        !RegExp(r'[a-z]').hasMatch(value) ||
        !RegExp(r'\d').hasMatch(value)) {
      return 'Gunakan huruf besar, huruf kecil, dan angka';
    }
    return null;
  }
}

class _AuthTab extends StatelessWidget {
  const _AuthTab({
    required this.label,
    required this.icon,
    required this.selected,
    required this.onPressed,
  });

  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 180),
      decoration: BoxDecoration(
        color: selected ? AppColors.primaryPink : Colors.transparent,
        borderRadius: BorderRadius.circular(999),
        boxShadow: selected
            ? [
                BoxShadow(
                  color: AppColors.primaryPink.withValues(alpha: 0.24),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ]
            : null,
      ),
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(999),
        child: SizedBox(
          height: 44,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                size: 17,
                color: selected ? AppColors.pureWhite : AppColors.deepRose,
              ),
              const SizedBox(width: 7),
              Flexible(
                child: Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.labelLarge?.copyWith(
                    color: selected ? AppColors.pureWhite : AppColors.deepRose,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
