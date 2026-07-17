import 'package:flutter/material.dart';
import 'package:florist_frontend/core/theme.dart';
import 'package:florist_frontend/features/admin/presentation/admin_product_form_page.dart';
import 'package:florist_frontend/features/home/domain/product_preview.dart';
import 'package:florist_frontend/features/home/presentation/widgets/product_artwork.dart';
import 'package:lucide_flutter/lucide_flutter.dart';

const _inventoryBackground = Color(0xFFF8F9FC);
const _inventoryBorder = Color(0xFFECEEF2);

class InventoryCatalogPage extends StatefulWidget {
  const InventoryCatalogPage({required this.showMenuButton, super.key});

  final bool showMenuButton;

  @override
  State<InventoryCatalogPage> createState() => _InventoryCatalogPageState();
}

class _InventoryCatalogPageState extends State<InventoryCatalogPage> {
  static const _boards = [
    _BoardData(
      name: 'Papan Akrilik Premium 01',
      status: 'Available',
      detail: 'Next booking 24 Oct',
      type: _BoardStatus.available,
      icon: LucideIcons.sparkles,
    ),
    _BoardData(
      name: 'Papan Kayu Rustic 02',
      status: 'In Use',
      detail: 'Returns Today 17:00',
      type: _BoardStatus.inUse,
      icon: LucideIcons.clock3,
    ),
    _BoardData(
      name: 'Papan Busa Standard 03',
      status: 'Available',
      detail: 'Ready to rent',
      type: _BoardStatus.available,
      icon: LucideIcons.badgeCheck,
    ),
    _BoardData(
      name: 'Papan LED Modern 04',
      status: 'Maintenance',
      detail: 'Repairing frame',
      type: _BoardStatus.maintenance,
      icon: LucideIcons.wrench,
    ),
  ];

  static const _initialProducts = [
    _ProductData(
      product: ProductPreview(
        name: 'Sweet Romance Bouquet',
        category: 'Bunga Bouquet',
        price: 325000,
        stockStatus: ProductStockStatus.readyStock,
        visual: ProductVisual.bouquet,
      ),
      stock: '12 Ready',
      price: 'Rp 325.000',
      inStock: true,
    ),
    _ProductData(
      product: ProductPreview(
        name: 'Peachy Blossom Box',
        category: 'Bloom Box',
        price: 285000,
        stockStatus: ProductStockStatus.preOrder,
        visual: ProductVisual.gift,
      ),
      stock: 'Out of Stock',
      price: 'Rp 285.000',
      inStock: false,
    ),
    _ProductData(
      product: ProductPreview(
        name: 'Vase Arrange - Spring',
        category: 'Bunga Meja',
        price: 410000,
        stockStatus: ProductStockStatus.readyStock,
        visual: ProductVisual.bouquet,
      ),
      stock: '7 Ready',
      price: 'Rp 410.000',
      inStock: true,
    ),
  ];

  late final List<_ProductData> _products = List.of(_initialProducts);
  final _visibleProducts = <bool>[true, true, false];
  var _currentPage = 1;

  @override
  Widget build(BuildContext context) {
    final isMobile = MediaQuery.sizeOf(context).width < 600;

    return ColoredBox(
      color: _inventoryBackground,
      child: SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.fromLTRB(
            isMobile ? 12 : 28,
            isMobile ? 16 : 26,
            isMobile ? 12 : 28,
            40,
          ),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 1360),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  _InventoryHeader(
                    isMobile: isMobile,
                    showMenuButton: widget.showMenuButton,
                    onAddProduct: () => _openProductForm(),
                  ),
                  SizedBox(height: isMobile ? 24 : 32),
                  Text(
                    'Manajemen Papan Ucapan (Sewa)',
                    style: Theme.of(
                      context,
                    ).textTheme.titleLarge?.copyWith(color: AppColors.charcoal),
                  ),
                  const SizedBox(height: 14),
                  SizedBox(
                    height: 176,
                    child: SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: _boards.indexed
                            .map(
                              (entry) => Padding(
                                padding: EdgeInsets.only(
                                  right: entry.$1 == _boards.length - 1
                                      ? 0
                                      : 14,
                                ),
                                child: _BoardCard(
                                  data: entry.$2,
                                  width: isMobile ? 230 : 250,
                                ),
                              ),
                            )
                            .toList(),
                      ),
                    ),
                  ),
                  SizedBox(height: isMobile ? 28 : 36),
                  _CatalogSection(
                    isMobile: isMobile,
                    products: _products,
                    visibleProducts: _visibleProducts,
                    onVisibilityChanged: (index, value) {
                      setState(() => _visibleProducts[index] = value);
                    },
                    onEdit: _openProductForm,
                    onAction: _showMessage,
                    currentPage: _currentPage,
                    onPageChanged: (page) {
                      setState(() => _currentPage = page);
                    },
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(content: Text(message), behavior: SnackBarBehavior.floating),
      );
  }

  Future<void> _openProductForm([ProductPreview? product]) async {
    final result = await Navigator.push<ProductPreview>(
      context,
      MaterialPageRoute(builder: (_) => AdminProductFormPage(product: product)),
    );
    if (result == null || !mounted) return;
    setState(() {
      final index = product == null
          ? -1
          : _products.indexWhere((item) => item.product.name == product.name);
      final data = _ProductData(
        product: result,
        stock: result.stockStatus == ProductStockStatus.readyStock
            ? '1 Ready'
            : 'Pre-Order',
        price: _formatPrice(result.price),
        inStock: true,
      );
      if (index >= 0) {
        _products[index] = data;
      } else {
        _products.insert(0, data);
        _visibleProducts.insert(0, true);
      }
    });
  }

  String _formatPrice(int price) {
    final digits = price.toString();
    final buffer = StringBuffer();
    for (var i = 0; i < digits.length; i++) {
      if (i > 0 && (digits.length - i) % 3 == 0) buffer.write('.');
      buffer.write(digits[i]);
    }
    return 'Rp $buffer';
  }
}

class _InventoryHeader extends StatelessWidget {
  const _InventoryHeader({
    required this.isMobile,
    required this.showMenuButton,
    required this.onAddProduct,
  });

  final bool isMobile;
  final bool showMenuButton;
  final VoidCallback onAddProduct;

  @override
  Widget build(BuildContext context) {
    final title = Text(
      'Inventory & Catalog',
      style: Theme.of(context).textTheme.headlineLarge?.copyWith(
        color: AppColors.charcoal,
        fontFamily: 'PlusJakartaSans',
        fontWeight: FontWeight.w700,
      ),
    );
    final button = FilledButton.icon(
      key: const ValueKey('add-inventory-product'),
      onPressed: onAddProduct,
      icon: const Icon(LucideIcons.plus, size: 18),
      label: const Text('Tambah Produk Baru'),
      style: FilledButton.styleFrom(
        backgroundColor: AppColors.primaryPink,
        minimumSize: Size(isMobile ? double.infinity : 190, 48),
      ),
    );

    if (isMobile) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              if (showMenuButton) ...[
                Builder(
                  builder: (context) => IconButton(
                    tooltip: 'Buka navigasi admin',
                    onPressed: () => Scaffold.of(context).openDrawer(),
                    icon: const Icon(LucideIcons.menu),
                  ),
                ),
                const SizedBox(width: 6),
              ],
              Expanded(child: title),
            ],
          ),
          const SizedBox(height: 14),
          button,
        ],
      );
    }

    return Row(
      children: [
        if (showMenuButton) ...[
          Builder(
            builder: (context) => IconButton(
              tooltip: 'Buka navigasi admin',
              onPressed: () => Scaffold.of(context).openDrawer(),
              icon: const Icon(LucideIcons.menu),
            ),
          ),
          const SizedBox(width: 10),
        ],
        Expanded(child: title),
        const SizedBox(width: 24),
        button,
      ],
    );
  }
}

class _BoardCard extends StatelessWidget {
  const _BoardCard({required this.data, required this.width});

  final _BoardData data;
  final double width;

  @override
  Widget build(BuildContext context) {
    final (background, foreground) = switch (data.type) {
      _BoardStatus.available => (const Color(0xFFE7F8EF), AppColors.success),
      _BoardStatus.inUse => (const Color(0xFFFFF4D6), AppColors.warning),
      _BoardStatus.maintenance => (
        const Color(0xFFFFE7D6),
        const Color(0xFFEA580C),
      ),
    };

    return Container(
      width: width,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.pureWhite,
        borderRadius: BorderRadius.circular(17),
        border: Border.all(color: _inventoryBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppColors.blushRose,
                  borderRadius: BorderRadius.circular(12),
                ),
                alignment: Alignment.center,
                child: Icon(data.icon, size: 19, color: AppColors.deepRose),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
                decoration: BoxDecoration(
                  color: background,
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  data.status,
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: foreground,
                    fontSize: 10,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            data.name,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(context).textTheme.titleSmall,
          ),
          const Spacer(),
          Text(data.detail, style: Theme.of(context).textTheme.bodySmall),
        ],
      ),
    );
  }
}

class _CatalogSection extends StatelessWidget {
  const _CatalogSection({
    required this.isMobile,
    required this.products,
    required this.visibleProducts,
    required this.onVisibilityChanged,
    required this.onEdit,
    required this.onAction,
    required this.currentPage,
    required this.onPageChanged,
  });

  final bool isMobile;
  final List<_ProductData> products;
  final List<bool> visibleProducts;
  final void Function(int index, bool value) onVisibilityChanged;
  final ValueChanged<ProductPreview> onEdit;
  final ValueChanged<String> onAction;
  final int currentPage;
  final ValueChanged<int> onPageChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.pureWhite,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: _inventoryBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: EdgeInsets.all(isMobile ? 14 : 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'Katalog Produk',
                  style: Theme.of(
                    context,
                  ).textTheme.titleLarge?.copyWith(color: AppColors.charcoal),
                ),
                const SizedBox(height: 14),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        decoration: InputDecoration(
                          hintText: 'Cari produk...',
                          prefixIcon: const Icon(LucideIcons.search, size: 19),
                          filled: true,
                          fillColor: _inventoryBackground,
                          contentPadding: const EdgeInsets.symmetric(
                            vertical: 12,
                          ),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(
                              color: _inventoryBorder,
                            ),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(
                              color: _inventoryBorder,
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    IconButton(
                      tooltip: 'Filter katalog',
                      onPressed: () =>
                          onAction('Filter katalog segera tersedia.'),
                      icon: const Icon(LucideIcons.listFilter, size: 20),
                      style: IconButton.styleFrom(
                        minimumSize: const Size.square(48),
                        side: const BorderSide(color: _inventoryBorder),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const Divider(height: 1, color: _inventoryBorder),
          if (isMobile)
            _MobileCatalogList(
              products: products,
              visibleProducts: visibleProducts,
              onVisibilityChanged: onVisibilityChanged,
              onEdit: onEdit,
              onAction: onAction,
            )
          else
            _CatalogTable(
              products: products,
              visibleProducts: visibleProducts,
              onVisibilityChanged: onVisibilityChanged,
              onEdit: onEdit,
              onAction: onAction,
            ),
          const Divider(height: 1, color: _inventoryBorder),
          _PaginationBar(
            currentPage: currentPage,
            onPageChanged: onPageChanged,
          ),
        ],
      ),
    );
  }
}

class _CatalogTable extends StatelessWidget {
  const _CatalogTable({
    required this.products,
    required this.visibleProducts,
    required this.onVisibilityChanged,
    required this.onEdit,
    required this.onAction,
  });

  final List<_ProductData> products;
  final List<bool> visibleProducts;
  final void Function(int index, bool value) onVisibilityChanged;
  final ValueChanged<ProductPreview> onEdit;
  final ValueChanged<String> onAction;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: DataTable(
        headingRowHeight: 52,
        dataRowMinHeight: 78,
        dataRowMaxHeight: 78,
        horizontalMargin: 20,
        columnSpacing: 34,
        headingTextStyle: Theme.of(context).textTheme.labelSmall?.copyWith(
          color: AppColors.mediumGray,
          fontSize: 10,
          letterSpacing: 0.6,
        ),
        columns: const [
          DataColumn(label: Text('PHOTO')),
          DataColumn(label: Text('NAME')),
          DataColumn(label: Text('CATEGORY')),
          DataColumn(label: Text('STOCK LEVEL')),
          DataColumn(label: Text('PRICE')),
          DataColumn(label: Text('TAMPIL DI TOKO')),
          DataColumn(label: Text('ACTIONS')),
        ],
        rows: products.indexed.map((entry) {
          final index = entry.$1;
          final item = entry.$2;
          return DataRow(
            cells: [
              DataCell(_ProductPhoto(product: item.product, size: 52)),
              DataCell(
                SizedBox(
                  width: 190,
                  child: Text(
                    item.product.name,
                    style: Theme.of(context).textTheme.labelLarge,
                  ),
                ),
              ),
              DataCell(_CategoryChip(label: item.product.category)),
              DataCell(_StockBadge(item: item)),
              DataCell(Text(item.price)),
              DataCell(
                Switch(
                  value: visibleProducts[index],
                  activeTrackColor: AppColors.primaryPink,
                  onChanged: (value) => onVisibilityChanged(index, value),
                ),
              ),
              DataCell(
                Row(
                  children: [
                    IconButton(
                      tooltip: 'Edit produk',
                      onPressed: () => onEdit(item.product),
                      icon: const Icon(LucideIcons.pencil, size: 18),
                    ),
                    IconButton(
                      tooltip: 'Hapus produk',
                      onPressed: () => onAction('Hapus ${item.product.name}'),
                      icon: const Icon(
                        LucideIcons.trash2,
                        size: 18,
                        color: AppColors.error,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          );
        }).toList(),
      ),
    );
  }
}

class _MobileCatalogList extends StatelessWidget {
  const _MobileCatalogList({
    required this.products,
    required this.visibleProducts,
    required this.onVisibilityChanged,
    required this.onEdit,
    required this.onAction,
  });

  final List<_ProductData> products;
  final List<bool> visibleProducts;
  final void Function(int index, bool value) onVisibilityChanged;
  final ValueChanged<ProductPreview> onEdit;
  final ValueChanged<String> onAction;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(12),
      child: Column(
        children: products.indexed.map((entry) {
          final index = entry.$1;
          final item = entry.$2;
          return Container(
            margin: const EdgeInsets.only(bottom: 10),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: _inventoryBackground,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: _inventoryBorder),
            ),
            child: Column(
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _ProductPhoto(product: item.product, size: 58),
                    const SizedBox(width: 11),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            item.product.name,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: Theme.of(context).textTheme.labelLarge,
                          ),
                          const SizedBox(height: 7),
                          Wrap(
                            spacing: 6,
                            runSpacing: 6,
                            children: [
                              _CategoryChip(label: item.product.category),
                              _StockBadge(item: item),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        item.price,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          color: AppColors.charcoal,
                        ),
                      ),
                    ),
                    Switch(
                      value: visibleProducts[index],
                      activeTrackColor: AppColors.primaryPink,
                      onChanged: (value) => onVisibilityChanged(index, value),
                    ),
                    IconButton(
                      tooltip: 'Edit produk',
                      onPressed: () => onEdit(item.product),
                      icon: const Icon(LucideIcons.pencil, size: 18),
                      style: IconButton.styleFrom(
                        minimumSize: const Size.square(40),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }
}

class _ProductPhoto extends StatelessWidget {
  const _ProductPhoto({required this.product, required this.size});

  final ProductPreview product;
  final double size;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(10),
      child: SizedBox.square(
        dimension: size,
        child: ProductArtwork(product: product),
      ),
    );
  }
}

class _CategoryChip extends StatelessWidget {
  const _CategoryChip({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
      decoration: BoxDecoration(
        color: AppColors.blushRose,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
          color: AppColors.deepRose,
          fontSize: 10,
        ),
      ),
    );
  }
}

class _StockBadge extends StatelessWidget {
  const _StockBadge({required this.item});

  final _ProductData item;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
      decoration: BoxDecoration(
        color: item.inStock
            ? AppColors.readyStockBackground
            : const Color(0xFFFFE9E9),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        item.stock,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
          color: item.inStock ? AppColors.readyStockText : AppColors.error,
          fontSize: 10,
        ),
      ),
    );
  }
}

class _PaginationBar extends StatelessWidget {
  const _PaginationBar({
    required this.currentPage,
    required this.onPageChanged,
  });

  final int currentPage;
  final ValueChanged<int> onPageChanged;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          _PageButton(
            label: '‹',
            onPressed: () => onPageChanged((currentPage - 1).clamp(1, 3)),
          ),
          const SizedBox(width: 5),
          _PageButton(
            label: '1',
            selected: currentPage == 1,
            onPressed: () => onPageChanged(1),
          ),
          const SizedBox(width: 5),
          _PageButton(
            label: '2',
            selected: currentPage == 2,
            onPressed: () => onPageChanged(2),
          ),
          const SizedBox(width: 5),
          _PageButton(
            label: '3',
            selected: currentPage == 3,
            onPressed: () => onPageChanged(3),
          ),
          const SizedBox(width: 5),
          _PageButton(
            label: '›',
            onPressed: () => onPageChanged((currentPage + 1).clamp(1, 3)),
          ),
        ],
      ),
    );
  }
}

class _PageButton extends StatelessWidget {
  const _PageButton({
    required this.label,
    required this.onPressed,
    this.selected = false,
  });

  final String label;
  final bool selected;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? AppColors.primaryPink : AppColors.pureWhite,
      borderRadius: BorderRadius.circular(9),
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(9),
        child: Container(
          width: 34,
          height: 34,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(9),
            border: Border.all(
              color: selected ? AppColors.primaryPink : _inventoryBorder,
            ),
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: Theme.of(context).textTheme.labelMedium?.copyWith(
              color: selected ? AppColors.pureWhite : AppColors.darkGray,
            ),
          ),
        ),
      ),
    );
  }
}

enum _BoardStatus { available, inUse, maintenance }

class _BoardData {
  const _BoardData({
    required this.name,
    required this.status,
    required this.detail,
    required this.type,
    required this.icon,
  });

  final String name;
  final String status;
  final String detail;
  final _BoardStatus type;
  final IconData icon;
}

class _ProductData {
  const _ProductData({
    required this.product,
    required this.stock,
    required this.price,
    required this.inStock,
  });

  final ProductPreview product;
  final String stock;
  final String price;
  final bool inStock;
}
