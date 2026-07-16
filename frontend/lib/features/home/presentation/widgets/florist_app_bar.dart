import 'package:flutter/material.dart';
import 'package:florist_frontend/core/theme.dart';
import 'package:lucide_flutter/lucide_flutter.dart';

class FloristAppBar extends StatelessWidget {
  const FloristAppBar({
    required this.cartCount,
    required this.onSearchPressed,
    required this.onCartPressed,
    super.key,
  });

  final int cartCount;
  final VoidCallback onSearchPressed;
  final VoidCallback onCartPressed;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.pureWhite,
      child: SafeArea(
        bottom: false,
        child: Container(
          height: 64,
          decoration: const BoxDecoration(
            border: Border(bottom: BorderSide(color: AppColors.lightGray)),
          ),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 1280),
              child: SizedBox(
                width: double.infinity,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Row(
                    children: [
                      const Icon(
                        LucideIcons.flower2,
                        color: AppColors.deepRose,
                        size: 27,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Seli Florist',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: Theme.of(context).textTheme.headlineMedium
                              ?.copyWith(color: AppColors.deepRose),
                        ),
                      ),
                      _HeaderIconButton(
                        tooltip: 'Cari produk',
                        icon: LucideIcons.search,
                        onPressed: onSearchPressed,
                      ),
                      const SizedBox(width: 8),
                      Stack(
                        clipBehavior: Clip.none,
                        children: [
                          _HeaderIconButton(
                            tooltip: 'Keranjang belanja',
                            icon: LucideIcons.shoppingCart,
                            onPressed: onCartPressed,
                          ),
                          if (cartCount > 0)
                            Positioned(
                              right: -2,
                              top: -3,
                              child: Container(
                                key: const ValueKey('cart-badge'),
                                constraints: const BoxConstraints(
                                  minWidth: 18,
                                  minHeight: 18,
                                ),
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 4,
                                ),
                                decoration: const BoxDecoration(
                                  color: AppColors.primaryPink,
                                  shape: BoxShape.circle,
                                ),
                                alignment: Alignment.center,
                                child: Text(
                                  cartCount > 99 ? '99+' : '$cartCount',
                                  key: const ValueKey('cart-badge-count'),
                                  style: Theme.of(context).textTheme.labelSmall
                                      ?.copyWith(
                                        color: AppColors.pureWhite,
                                        fontSize: 10,
                                        height: 1,
                                      ),
                                ),
                              ),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _HeaderIconButton extends StatelessWidget {
  const _HeaderIconButton({
    required this.tooltip,
    required this.icon,
    required this.onPressed,
  });

  final String tooltip;
  final IconData icon;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return IconButton(
      tooltip: tooltip,
      onPressed: onPressed,
      icon: Icon(icon, size: 21),
      color: AppColors.darkGray,
      style: IconButton.styleFrom(
        minimumSize: const Size.square(44),
        backgroundColor: AppColors.offWhite,
        shape: const CircleBorder(),
      ),
    );
  }
}
