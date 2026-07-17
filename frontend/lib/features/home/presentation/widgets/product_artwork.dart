import 'package:flutter/material.dart';
import 'package:florist_frontend/core/api_client.dart';
import 'package:florist_frontend/core/theme.dart';
import 'package:florist_frontend/features/home/domain/product_preview.dart';
import 'package:lucide_flutter/lucide_flutter.dart';

class ProductArtwork extends StatelessWidget {
  const ProductArtwork({
    required this.product,
    this.showStockBadge = false,
    this.isFavorite = false,
    this.onFavoritePressed,
    super.key,
  });

  final ProductPreview product;
  final bool showStockBadge;
  final bool isFavorite;
  final VoidCallback? onFavoritePressed;

  @override
  Widget build(BuildContext context) {
    final visualStyle = _styleFor(product.visual);
    final isReady = product.stockStatus == ProductStockStatus.readyStock;
    final isOutOfStock = isReady && product.availableQty == 0;

    return LayoutBuilder(
      builder: (context, constraints) {
        final isCompact = constraints.maxWidth < 160;
        final iconSize = (constraints.biggest.shortestSide * 0.46).clamp(
          38.0,
          112.0,
        );

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
              Positioned.fill(
                child: product.imageUrl == null || product.imageUrl!.isEmpty
                    ? _PlaceholderArtwork(
                        visualStyle: visualStyle,
                        iconSize: iconSize,
                      )
                    : Image.network(
                        _resolveImageUrl(product.imageUrl!),
                        fit: BoxFit.cover,
                        semanticLabel: visualStyle.semanticLabel,
                        errorBuilder: (_, _, _) => _PlaceholderArtwork(
                          visualStyle: visualStyle,
                          iconSize: iconSize,
                        ),
                      ),
              ),
              if (showStockBadge)
                Positioned(
                  left: 8,
                  top: 8,
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      color: isOutOfStock
                          ? AppColors.blushRose
                          : isReady
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
                              color: isOutOfStock
                                  ? AppColors.error
                                  : isReady
                                  ? AppColors.readyStockText
                                  : AppColors.preOrderText,
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 5),
                          Text(
                            isOutOfStock
                                ? 'Stok Habis'
                                : isReady
                                ? 'Ready Stock'
                                : 'Pre-Order',
                            style: Theme.of(context).textTheme.labelSmall
                                ?.copyWith(
                                  color: isOutOfStock
                                      ? AppColors.error
                                      : isReady
                                      ? AppColors.readyStockText
                                      : AppColors.preOrderText,
                                ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              if (onFavoritePressed != null)
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
                      color: isFavorite
                          ? AppColors.error
                          : AppColors.mediumGray,
                    ),
                    style: IconButton.styleFrom(
                      minimumSize: const Size.square(44),
                      backgroundColor: AppColors.pureWhite.withValues(
                        alpha: 0.9,
                      ),
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

  String _resolveImageUrl(String value) {
    final uri = Uri.tryParse(value);
    if (uri?.hasScheme == true) return value;
    return Uri.parse(apiBaseUrl).resolve(value).toString();
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

class _PlaceholderArtwork extends StatelessWidget {
  const _PlaceholderArtwork({
    required this.visualStyle,
    required this.iconSize,
  });

  final _ProductVisualStyle visualStyle;
  final double iconSize;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Semantics(
        label: visualStyle.semanticLabel,
        image: true,
        child: Icon(
          visualStyle.icon,
          size: iconSize,
          color: visualStyle.accentColor,
        ),
      ),
    );
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
