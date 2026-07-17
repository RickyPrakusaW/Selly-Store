import 'package:flutter/material.dart';
import 'package:florist_frontend/core/currency_formatter.dart';
import 'package:florist_frontend/core/theme.dart';
import 'package:florist_frontend/features/home/domain/product_preview.dart';
import 'package:florist_frontend/features/home/presentation/widgets/product_artwork.dart';
import 'package:lucide_flutter/lucide_flutter.dart';

class ProductCard extends StatefulWidget {
  const ProductCard({
    required this.product,
    required this.onPressed,
    required this.onAddPressed,
    super.key,
  });

  final ProductPreview product;
  final VoidCallback onPressed;
  final VoidCallback onAddPressed;

  @override
  State<ProductCard> createState() => _ProductCardState();
}

class _ProductCardState extends State<ProductCard> {
  var _isHovered = false;
  var _isFavorite = false;

  @override
  Widget build(BuildContext context) {
    final isOutOfStock =
        widget.product.stockStatus == ProductStockStatus.readyStock &&
        widget.product.availableQty == 0;
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
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: widget.onPressed,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                AspectRatio(
                  aspectRatio: 1,
                  child: ProductArtwork(
                    product: widget.product,
                    showStockBadge: true,
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
                          formatRupiah(widget.product.price),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: Theme.of(context).textTheme.titleMedium
                              ?.copyWith(
                                color: AppColors.deepRose,
                                fontWeight: FontWeight.w700,
                              ),
                        ),
                        const SizedBox(height: 10),
                        SizedBox(
                          width: double.infinity,
                          child: FilledButton.icon(
                            onPressed: isOutOfStock
                                ? null
                                : widget.onAddPressed,
                            icon: const Icon(LucideIcons.plus, size: 17),
                            label: Text(isOutOfStock ? 'Stok Habis' : 'Tambah'),
                            style: FilledButton.styleFrom(
                              minimumSize: const Size.fromHeight(44),
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                              ),
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
        ),
      ),
    );
  }
}
