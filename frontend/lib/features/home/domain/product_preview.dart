enum ProductStockStatus { readyStock, preOrder }

enum ProductVisual { bouquet, gift, board }

class ProductPreview {
  const ProductPreview({
    required this.name,
    required this.category,
    required this.price,
    required this.stockStatus,
    required this.visual,
  });

  final String name;
  final String category;
  final int price;
  final ProductStockStatus stockStatus;
  final ProductVisual visual;
}
