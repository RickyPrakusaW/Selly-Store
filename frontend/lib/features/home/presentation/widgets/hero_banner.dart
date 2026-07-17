import 'package:flutter/material.dart';
import 'package:florist_frontend/core/theme.dart';
import 'package:lucide_flutter/lucide_flutter.dart';

class HeroBanner extends StatelessWidget {
  const HeroBanner({required this.onShopPressed, super.key});

  final VoidCallback onShopPressed;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final isMobile = constraints.maxWidth < 640;
        final horizontalPadding = isMobile ? 16.0 : 32.0;

        return Container(
          width: double.infinity,
          height: isMobile ? 336 : 320,
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                AppColors.blushRose,
                AppColors.offWhite,
                AppColors.softPink,
              ],
              stops: [0, 0.62, 1],
            ),
          ),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 1280),
              child: SizedBox(
                width: double.infinity,
                height: isMobile ? 336 : 320,
                child: Stack(
                  children: [
                    Positioned(
                      right: isMobile ? -52 : 34,
                      top: isMobile ? 54 : 34,
                      child: IgnorePointer(
                        child: _FloralArtwork(isMobile: isMobile),
                      ),
                    ),
                    Padding(
                      padding: EdgeInsets.symmetric(
                        horizontal: horizontalPadding,
                        vertical: isMobile ? 24 : 32,
                      ),
                      child: FractionallySizedBox(
                        alignment: Alignment.centerLeft,
                        widthFactor: isMobile ? 0.68 : 0.62,
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Bunga & hadiah untuk setiap momen',
                              maxLines: 3,
                              overflow: TextOverflow.ellipsis,
                              style:
                                  (isMobile
                                          ? Theme.of(
                                              context,
                                            ).textTheme.displayMedium
                                          : Theme.of(
                                              context,
                                            ).textTheme.displayLarge)
                                      ?.copyWith(color: AppColors.charcoal),
                            ),
                            const SizedBox(height: 12),
                            Text(
                              'Rangkaian personal yang dibuat hangat untuk orang-orang tersayang.',
                              maxLines: 3,
                              overflow: TextOverflow.ellipsis,
                              style: Theme.of(context).textTheme.bodyMedium
                                  ?.copyWith(color: AppColors.darkGray),
                            ),
                            const SizedBox(height: 20),
                            ElevatedButton.icon(
                              onPressed: onShopPressed,
                              iconAlignment: IconAlignment.end,
                              icon: const Icon(
                                LucideIcons.arrowRight,
                                size: 18,
                              ),
                              label: const Text('Belanja Sekarang'),
                              style: ElevatedButton.styleFrom(
                                shadowColor: AppColors.primaryPink.withValues(
                                  alpha: 0.35,
                                ),
                                elevation: 5,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

class _FloralArtwork extends StatelessWidget {
  const _FloralArtwork({required this.isMobile});

  final bool isMobile;

  @override
  Widget build(BuildContext context) {
    final size = isMobile ? 140.0 : 232.0;

    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          Transform.rotate(
            angle: -0.42,
            child: Icon(
              LucideIcons.leaf,
              size: size * 0.72,
              color: AppColors.success.withValues(alpha: 0.24),
            ),
          ),
          Transform.translate(
            offset: Offset(size * 0.14, size * 0.18),
            child: Transform.rotate(
              angle: 0.5,
              child: Icon(
                LucideIcons.leaf,
                size: size * 0.58,
                color: AppColors.success.withValues(alpha: 0.18),
              ),
            ),
          ),
          Icon(
            LucideIcons.flower2,
            size: size * 0.78,
            color: AppColors.deepRose.withValues(alpha: 0.5),
          ),
          Transform.translate(
            offset: Offset(-size * 0.3, -size * 0.22),
            child: Icon(
              LucideIcons.flower,
              size: size * 0.3,
              color: AppColors.primaryPink.withValues(alpha: 0.75),
            ),
          ),
          Transform.translate(
            offset: Offset(size * 0.32, -size * 0.22),
            child: Icon(
              LucideIcons.sparkles,
              size: size * 0.2,
              color: AppColors.warning.withValues(alpha: 0.72),
            ),
          ),
        ],
      ),
    );
  }
}
