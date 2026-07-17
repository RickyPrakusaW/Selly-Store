enum ProductStockStatus { readyStock, preOrder }

enum ProductVisual { bouquet, gift, board }

class ProductPreview {
  const ProductPreview({
    this.id = '',
    required this.name,
    required this.category,
    this.categorySlug = '',
    required this.price,
    required this.stockStatus,
    required this.visual,
    this.description,
    this.imageUrl,
    this.availableQty,
  });

  factory ProductPreview.fromJson(Map<String, dynamic> json) {
    final categoryJson = json['category'];
    final category = categoryJson is Map
        ? Map<String, dynamic>.from(categoryJson)
        : const <String, dynamic>{};
    final slug = category['slug']?.toString() ?? '';
    final rawPrice = json['basePrice'];
    final numericPrice = rawPrice is num
        ? rawPrice
        : num.tryParse(rawPrice?.toString() ?? '') ?? 0;
    final rawImages = json['images'];
    String? imageUrl;
    if (rawImages is List && rawImages.isNotEmpty && rawImages.first is Map) {
      imageUrl = (rawImages.first as Map)['imageUrl']?.toString();
    }
    final stockType = json['stockType']?.toString().toLowerCase() ?? '';

    return ProductPreview(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Produk Seli Florist',
      category: category['name']?.toString() ?? _categoryLabel(slug),
      categorySlug: slug,
      price: numericPrice.round(),
      stockStatus: stockType.contains('pre_order')
          ? ProductStockStatus.preOrder
          : ProductStockStatus.readyStock,
      visual: switch (slug) {
        'kado' => ProductVisual.gift,
        'papan_ucapan' => ProductVisual.board,
        _ => ProductVisual.bouquet,
      },
      description: json['description']?.toString(),
      imageUrl: imageUrl,
      availableQty: switch (json['availableQty']) {
        final num value => value.toInt(),
        final String value => int.tryParse(value),
        _ => null,
      },
    );
  }

  final String id;
  final String name;
  final String category;
  final String categorySlug;
  final int price;
  final ProductStockStatus stockStatus;
  final ProductVisual visual;
  final String? description;
  final String? imageUrl;
  final int? availableQty;

  static String _categoryLabel(String slug) {
    return switch (slug) {
      'bunga' => 'Bunga',
      'kado' => 'Kado',
      'papan_ucapan' => 'Papan Sewa',
      _ => 'Produk',
    };
  }
}
