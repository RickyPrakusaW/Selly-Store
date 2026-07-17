import 'package:flutter/material.dart';
import 'package:florist_frontend/core/auth_state.dart';
import 'package:florist_frontend/core/theme.dart';
import 'package:florist_frontend/features/account/presentation/admin_panel_page.dart';
import 'package:florist_frontend/features/cart/presentation/widgets/auth_bottom_sheet.dart';
import 'package:lucide_flutter/lucide_flutter.dart';

class AccountPage extends StatelessWidget {
  const AccountPage({super.key});

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<AuthState>(
      valueListenable: authNotifier,
      builder: (context, auth, _) {
        if (!auth.isLoggedIn) {
          return _LoggedOutAccount(onSignIn: () => _openAuth(context));
        }
        return _LoggedInAccount(
          name: auth.userName ?? 'Pelanggan Seli',
          email: auth.userEmail ?? '-',
          onLogout: () async {
            try {
              await authNotifier.logout();
            } catch (error) {
              if (!context.mounted) return;
              ScaffoldMessenger.of(context)
                ..hideCurrentSnackBar()
                ..showSnackBar(
                  const SnackBar(
                    content: Text(
                      'Sesi lokal sudah ditutup, tetapi server tidak dapat dihubungi.',
                    ),
                    behavior: SnackBarBehavior.floating,
                  ),
                );
            }
          },
          onOpenAdmin: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const AdminPanelPage()),
            );
          },
        );
      },
    );
  }

  Future<void> _openAuth(BuildContext context) async {
    await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.pureWhite,
      barrierColor: Colors.black.withValues(alpha: 0.4),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      clipBehavior: Clip.antiAlias,
      builder: (_) => const AuthBottomSheet(),
    );
  }
}

class _LoggedOutAccount extends StatelessWidget {
  const _LoggedOutAccount({required this.onSignIn});

  final VoidCallback onSignIn;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 104,
              height: 104,
              decoration: const BoxDecoration(
                color: AppColors.blushRose,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                LucideIcons.userRound,
                size: 48,
                color: AppColors.deepRose,
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'Selamat datang di Seli Florist',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.displaySmall,
            ),
            const SizedBox(height: 8),
            Text(
              'Masuk untuk melihat pesanan dan mendapatkan pengalaman belanja yang lebih personal.',
              textAlign: TextAlign.center,
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: AppColors.mediumGray),
            ),
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: onSignIn,
              icon: const Icon(LucideIcons.logIn, size: 19),
              label: const Text('Masuk / Daftar Akun'),
              style: FilledButton.styleFrom(
                minimumSize: const Size.fromHeight(52),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _LoggedInAccount extends StatelessWidget {
  const _LoggedInAccount({
    required this.name,
    required this.email,
    required this.onLogout,
    required this.onOpenAdmin,
  });

  final String name;
  final String email;
  final VoidCallback onLogout;
  final VoidCallback onOpenAdmin;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 24, 16, 32),
      children: [
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [AppColors.blushRose, AppColors.offWhite],
            ),
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: AppColors.softPink),
          ),
          child: Row(
            children: [
              Container(
                width: 58,
                height: 58,
                decoration: const BoxDecoration(
                  color: AppColors.primaryPink,
                  shape: BoxShape.circle,
                ),
                alignment: Alignment.center,
                child: Text(
                  'S',
                  style: TextStyle(
                    color: AppColors.pureWhite,
                    fontFamily: 'PlayfairDisplay',
                    fontSize: 28,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(name, style: Theme.of(context).textTheme.titleLarge),
                    const SizedBox(height: 3),
                    Text(email, style: Theme.of(context).textTheme.bodySmall),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        Text('Akun & Admin', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 12),
        FilledButton.icon(
          onPressed: onOpenAdmin,
          icon: const Icon(LucideIcons.shieldCheck, size: 19),
          label: const Text('Buka Seli Florist Manager'),
          style: FilledButton.styleFrom(
            backgroundColor: AppColors.deepRose,
            minimumSize: const Size.fromHeight(52),
          ),
        ),
        const SizedBox(height: 12),
        OutlinedButton.icon(
          onPressed: onLogout,
          icon: const Icon(LucideIcons.logOut, size: 19),
          label: const Text('Keluar Akun'),
          style: OutlinedButton.styleFrom(
            foregroundColor: AppColors.deepRose,
            side: const BorderSide(color: AppColors.softPink),
            minimumSize: const Size.fromHeight(52),
          ),
        ),
      ],
    );
  }
}
