import 'package:flutter/material.dart';
import 'package:florist_frontend/core/theme.dart';
import 'package:florist_frontend/features/home/domain/product_preview.dart';
import 'package:lucide_flutter/lucide_flutter.dart';

class ProductCard extends StatefulWidget {
  const ProductCard({
    required this.product,
    required this.onAddPressed,
    super.key,
  });

  final ProductPreview product;
  final VoidCallback onAddPressed;

  @override
  State<ProductCard> createState() => _ProductCardState();
}

class _ProductCardState extends State<ProductCard> {
  var _isHovered = false;
  var _isFavorite = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeOut,
        transform: Matrix4.translationValues(0, _isHovered ? -4 : 0, 0),
        decoration: BoxDecoration(
          color: AppColors.pureWhite,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.lightGray),
          boxShadow: [
            BoxShadow(
              color: _isHovered
                  ? AppColors.primaryPink.withValues(alpha: 0.16)
                  : Colors.black.withValues(alpha: 0.06),
              blurRadius: _isHovered ? 24 : 8,
              offset: Offset(0, _isHovered ? 8 : 2),
            ),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            AspectRatio(
              aspectRatio: 1,
              child: _ProductArtwork(
                visual: widget.product.visual,
                stockStatus: widget.product.stockStatus,
                isFavorite: _isFavorite,
                onFavoritePressed: () {
                  setState(() => _isFavorite = !_isFavorite);
                },
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.product.name,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 8),
                    DecoratedBox(
                      decoration: BoxDecoration(
                        color: AppColors.blushRose,
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 9,
                          vertical: 4,
                        ),
                        child: Text(
                          widget.product.category,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: Theme.of(context).textTheme.labelSmall
                              ?.copyWith(color: AppColors.deepRose),
                        ),
                      ),
                    ),
                    const Spacer(),
                    Text(
                      _formatRupiah(widget.product.price),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: AppColors.deepRose,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 10),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton.icon(
                        onPressed: widget.onAddPressed,
                        icon: const Icon(LucideIcons.plus, size: 17),
                        label: const Text('Tambah'),
                        style: FilledButton.styleFrom(
                          minimumSize: const Size.fromHeight(44),
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatRupiah(int amount) {
    final digits = amount.toString();
    final result = StringBuffer('Rp ');

    for (var index = 0; index < digits.length; index++) {
      if (index > 0 && (digits.length - index) % 3 == 0) {
        result.write('.');
      }
      result.write(digits[index]);
    }

    return result.toString();
  }
}

class _ProductArtwork extends StatelessWidget {
  const _ProductArtwork({
    required this.visual,
    required this.stockStatus,
    required this.isFavorite,
    required this.onFavoritePressed,
  });

  final ProductVisual visual;
  final ProductStockStatus stockStatus;
  final bool isFavorite;
  final VoidCallback onFavoritePressed;

  @override
  Widget build(BuildContext context) {
    final visualStyle = _styleFor(visual);
    final isReady = stockStatus == ProductStockStatus.readyStock;

    return LayoutBuilder(
      builder: (context, constraints) {
        final isCompact = constraints.maxWidth < 160;

        return DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: visualStyle.backgroundColors,
            ),
          ),
          child: Stack(
            children: [
              Center(
                child: Semantics(
                  label: visualStyle.semanticLabel,
                  image: true,
                  child: Icon(
                    visualStyle.icon,
                    size: isCompact ? 60 : 74,
                    color: visualStyle.accentColor,
                  ),
                ),
              ),
              Positioned(
                left: 8,
                top: 8,
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    color: isReady
                        ? AppColors.readyStockBackground
                        : AppColors.preOrderBackground,
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 5,
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 6,
                          height: 6,
                          decoration: BoxDecoration(
                            color: isReady
                                ? AppColors.readyStockText
                                : AppColors.preOrderText,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 5),
                        Text(
                          isReady ? 'Ready Stock' : 'Pre-Order',
                          style: Theme.of(context).textTheme.labelSmall
                              ?.copyWith(
                                color: isReady
                                    ? AppColors.readyStockText
                                    : AppColors.preOrderText,
                              ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              Positioned(
                right: 8,
                top: isCompact ? null : 8,
                bottom: isCompact ? 8 : null,
                child: IconButton(
                  tooltip: isFavorite
                      ? 'Hapus dari favorit'
                      : 'Tambah ke favorit',
                  onPressed: onFavoritePressed,
                  icon: Icon(
                    LucideIcons.heart,
                    size: 19,
                    color: isFavorite ? AppColors.error : AppColors.mediumGray,
                  ),
                  style: IconButton.styleFrom(
                    minimumSize: const Size.square(44),
                    backgroundColor: AppColors.pureWhite.withValues(alpha: 0.9),
                    shape: const CircleBorder(),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  _ProductVisualStyle _styleFor(ProductVisual visual) {
    return switch (visual) {
      ProductVisual.bouquet => const _ProductVisualStyle(
        icon: LucideIcons.flower2,
        accentColor: AppColors.deepRose,
        backgroundColors: [AppColors.offWhite, AppColors.softPink],
        semanticLabel: 'Ilustrasi buket bunga',
      ),
      ProductVisual.gift => const _ProductVisualStyle(
        icon: LucideIcons.gift,
        accentColor: AppColors.preOrderText,
        backgroundColors: [AppColors.offWhite, AppColors.creamGold],
        semanticLabel: 'Ilustrasi hadiah',
      ),
      ProductVisual.board => const _ProductVisualStyle(
        icon: LucideIcons.messageSquareText,
        accentColor: AppColors.deepRose,
        backgroundColors: [AppColors.blushRose, AppColors.lavenderMist],
        semanticLabel: 'Ilustrasi papan ucapan',
      ),
    };
  }
}

class _ProductVisualStyle {
  const _ProductVisualStyle({
    required this.icon,
    required this.accentColor,
    required this.backgroundColors,
    required this.semanticLabel,
  });

  final IconData icon;
  final Color accentColor;
  final List<Color> backgroundColors;
  final String semanticLabel;
}
