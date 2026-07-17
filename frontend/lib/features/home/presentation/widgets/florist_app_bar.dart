import 'package:flutter/material.dart';
import 'package:florist_frontend/core/cart_state.dart';
import 'package:florist_frontend/core/theme.dart';
import 'package:lucide_flutter/lucide_flutter.dart';

class FloristAppBar extends StatelessWidget {
  const FloristAppBar({
    required this.categories,
    required this.selectedCategory,
    required this.onCategorySelected,
    required this.onSearchPressed,
    required this.onProfilePressed,
    required this.onWishlistPressed,
    required this.onCartPressed,
    super.key,
  });

  final List<String> categories;
  final String selectedCategory;
  final ValueChanged<String> onCategorySelected;
  final VoidCallback onSearchPressed;
  final VoidCallback onProfilePressed;
  final VoidCallback onWishlistPressed;
  final VoidCallback onCartPressed;

  @override
  Widget build(BuildContext context) {
    final isPhone = MediaQuery.sizeOf(context).width < 600;

    return Material(
      color: AppColors.pureWhite,
      child: SafeArea(
        bottom: false,
        child: Container(
          height: 76,
          decoration: const BoxDecoration(
            border: Border(bottom: BorderSide(color: AppColors.lightGray)),
            boxShadow: [
              BoxShadow(
                color: Color(0x08000000),
                blurRadius: 18,
                offset: Offset(0, 4),
              ),
            ],
          ),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 1280),
              child: LayoutBuilder(
                builder: (context, constraints) {
                  final showDesktopTools = constraints.maxWidth >= 900;
                  final horizontalPadding = isPhone ? 12.0 : 24.0;

                  return Padding(
                    padding: EdgeInsets.symmetric(
                      horizontal: horizontalPadding,
                    ),
                    child: Row(
                      children: [
                        Flexible(
                          flex: showDesktopTools ? 0 : 1,
                          child: const _BrandLogo(),
                        ),
                        if (showDesktopTools) ...[
                          const SizedBox(width: 26),
                          _CategoryMenu(
                            categories: categories,
                            selectedCategory: selectedCategory,
                            onSelected: onCategorySelected,
                          ),
                          const SizedBox(width: 28),
                          Expanded(
                            child: _SearchBar(onPressed: onSearchPressed),
                          ),
                          const SizedBox(width: 26),
                        ] else
                          const Spacer(),
                        _HeaderActions(
                          isPhone: isPhone,
                          onProfilePressed: onProfilePressed,
                          onWishlistPressed: onWishlistPressed,
                          onCartPressed: onCartPressed,
                          onMenuPressed: () =>
                              Scaffold.of(context).openEndDrawer(),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _BrandLogo extends StatelessWidget {
  const _BrandLogo();

  @override
  Widget build(BuildContext context) {
    return Text(
      'Seli Florist',
      maxLines: 1,
      overflow: TextOverflow.ellipsis,
      style: const TextStyle(
        fontFamily: 'PlayfairDisplay',
        fontSize: 24,
        height: 1.2,
        fontWeight: FontWeight.w700,
        fontStyle: FontStyle.italic,
        color: AppColors.deepRose,
        letterSpacing: -0.4,
      ),
    );
  }
}

class _CategoryMenu extends StatelessWidget {
  const _CategoryMenu({
    required this.categories,
    required this.selectedCategory,
    required this.onSelected,
  });

  final List<String> categories;
  final String selectedCategory;
  final ValueChanged<String> onSelected;

  @override
  Widget build(BuildContext context) {
    return PopupMenuButton<String>(
      tooltip: 'Pilih kategori',
      initialValue: selectedCategory,
      onSelected: onSelected,
      position: PopupMenuPosition.under,
      offset: const Offset(0, 8),
      color: AppColors.pureWhite,
      elevation: 8,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      itemBuilder: (context) => categories
          .map(
            (category) => PopupMenuItem<String>(
              value: category,
              child: Row(
                children: [
                  Expanded(child: Text(category)),
                  if (category == selectedCategory)
                    const Icon(
                      LucideIcons.check,
                      size: 17,
                      color: AppColors.deepRose,
                    ),
                ],
              ),
            ),
          )
          .toList(),
      child: Container(
        height: 44,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.lightGray),
        ),
        child: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(LucideIcons.menu, size: 19, color: AppColors.darkGray),
            SizedBox(width: 9),
            Text(
              'Kategori',
              style: TextStyle(
                fontFamily: 'PlusJakartaSans',
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppColors.charcoal,
              ),
            ),
            SizedBox(width: 9),
            Icon(
              LucideIcons.chevronDown,
              size: 17,
              color: AppColors.mediumGray,
            ),
          ],
        ),
      ),
    );
  }
}

class _SearchBar extends StatelessWidget {
  const _SearchBar({required this.onPressed});

  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: 'Cari produk',
      child: InkWell(
        key: const ValueKey('header-search'),
        onTap: onPressed,
        borderRadius: BorderRadius.circular(999),
        hoverColor: AppColors.blushRose.withValues(alpha: 0.55),
        child: Container(
          height: 48,
          padding: const EdgeInsets.symmetric(horizontal: 20),
          decoration: BoxDecoration(
            color: AppColors.offWhite,
            borderRadius: BorderRadius.circular(999),
            border: Border.all(color: const Color(0xFFFFE4EA)),
          ),
          child: const Row(
            children: [
              Icon(LucideIcons.search, size: 20, color: AppColors.mediumGray),
              SizedBox(width: 12),
              Expanded(
                child: Text(
                  'Search flowers, gifts, boards...',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontFamily: 'PlusJakartaSans',
                    fontSize: 14,
                    color: AppColors.mediumGray,
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

class _HeaderActions extends StatelessWidget {
  const _HeaderActions({
    required this.isPhone,
    required this.onProfilePressed,
    required this.onWishlistPressed,
    required this.onCartPressed,
    required this.onMenuPressed,
  });

  final bool isPhone;
  final VoidCallback onProfilePressed;
  final VoidCallback onWishlistPressed;
  final VoidCallback onCartPressed;
  final VoidCallback onMenuPressed;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (!isPhone) ...[
          _HeaderIconButton(
            tooltip: 'Profil',
            icon: LucideIcons.user,
            onPressed: onProfilePressed,
          ),
          const SizedBox(width: 4),
          _HeaderIconButton(
            tooltip: 'Wishlist',
            icon: LucideIcons.heart,
            onPressed: onWishlistPressed,
          ),
          const SizedBox(width: 4),
        ],
        ValueListenableBuilder<List<CartItem>>(
          valueListenable: cartNotifier,
          builder: (context, items, _) {
            final cartCount = cartNotifier.totalQuantity;
            return Stack(
              clipBehavior: Clip.none,
              children: [
                _HeaderIconButton(
                  tooltip: 'Keranjang belanja',
                  icon: LucideIcons.shoppingCart,
                  onPressed: onCartPressed,
                ),
                if (cartCount > 0)
                  Positioned(
                    right: 0,
                    top: 0,
                    child: Container(
                      key: const ValueKey('cart-badge'),
                      constraints: const BoxConstraints(
                        minWidth: 18,
                        minHeight: 18,
                      ),
                      padding: const EdgeInsets.symmetric(horizontal: 4),
                      decoration: const BoxDecoration(
                        color: AppColors.deepRose,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Color(0x33DB2777),
                            blurRadius: 6,
                            offset: Offset(0, 2),
                          ),
                        ],
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        cartCount > 99 ? '99+' : '$cartCount',
                        key: const ValueKey('cart-badge-count'),
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: AppColors.pureWhite,
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          height: 1,
                        ),
                      ),
                    ),
                  ),
              ],
            );
          },
        ),
        if (isPhone) ...[
          const SizedBox(width: 4),
          _HeaderIconButton(
            tooltip: 'Buka menu',
            icon: LucideIcons.menu,
            onPressed: onMenuPressed,
          ),
        ],
      ],
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
      style: ButtonStyle(
        minimumSize: const WidgetStatePropertyAll(Size.square(44)),
        shape: const WidgetStatePropertyAll(CircleBorder()),
        backgroundColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.pressed)) {
            return AppColors.blushRose;
          }
          if (states.contains(WidgetState.hovered) ||
              states.contains(WidgetState.focused)) {
            return AppColors.offWhite;
          }
          return Colors.transparent;
        }),
      ),
    );
  }
}
