import 'package:flutter/material.dart';
import 'package:florist_frontend/features/account/presentation/account_page.dart';
import 'package:florist_frontend/core/theme.dart';
import 'package:florist_frontend/features/catalog/presentation/product_detail_page.dart';
import 'package:florist_frontend/features/home/domain/product_preview.dart';
import 'package:florist_frontend/features/orders/presentation/order_history_page.dart';
import 'package:florist_frontend/features/home/presentation/widgets/category_chips.dart';
import 'package:florist_frontend/features/home/presentation/widgets/florist_app_bar.dart';
import 'package:florist_frontend/features/home/presentation/widgets/hero_banner.dart';
import 'package:florist_frontend/features/home/presentation/widgets/product_card.dart';
import 'package:lucide_flutter/lucide_flutter.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  static const _categories = ['Semua', 'Bunga', 'Kado', 'Papan Sewa'];

  static const _products = [
    ProductPreview(
      name: 'Buket Mawar Blush',
      category: 'Bunga',
      price: 185000,
      stockStatus: ProductStockStatus.readyStock,
      visual: ProductVisual.bouquet,
    ),
    ProductPreview(
      name: 'Blooming Pastel Bouquet',
      category: 'Bunga',
      price: 225000,
      stockStatus: ProductStockStatus.preOrder,
      visual: ProductVisual.bouquet,
    ),
    ProductPreview(
      name: 'Gift Box Sweet Moment',
      category: 'Kado',
      price: 149000,
      stockStatus: ProductStockStatus.readyStock,
      visual: ProductVisual.gift,
    ),
    ProductPreview(
      name: 'Papan Ucapan Rose Garden',
      category: 'Papan Sewa',
      price: 350000,
      stockStatus: ProductStockStatus.preOrder,
      visual: ProductVisual.board,
    ),
    ProductPreview(
      name: 'Buket Lily Elegance',
      category: 'Bunga',
      price: 275000,
      stockStatus: ProductStockStatus.readyStock,
      visual: ProductVisual.bouquet,
    ),
    ProductPreview(
      name: 'Birthday Treasure Box',
      category: 'Kado',
      price: 199000,
      stockStatus: ProductStockStatus.readyStock,
      visual: ProductVisual.gift,
    ),
    ProductPreview(
      name: 'Papan Ucapan Lavender',
      category: 'Papan Sewa',
      price: 325000,
      stockStatus: ProductStockStatus.preOrder,
      visual: ProductVisual.board,
    ),
    ProductPreview(
      name: 'Buket Peach Harmony',
      category: 'Bunga',
      price: 210000,
      stockStatus: ProductStockStatus.readyStock,
      visual: ProductVisual.bouquet,
    ),
  ];

  final _scrollController = ScrollController();
  final _featuredSectionKey = GlobalKey();
  var _selectedCategory = 'Semua';
  var _currentIndex = 0;

  List<ProductPreview> get _visibleProducts {
    if (_selectedCategory == 'Semua') {
      return _products;
    }

    return _products
        .where((product) => product.category == _selectedCategory)
        .toList();
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: _currentIndex == 0
          ? PreferredSize(
              preferredSize: const Size.fromHeight(64),
              child: FloristAppBar(
                onSearchPressed: _openSearch,
                onCartPressed: () => Navigator.pushNamed(context, '/cart'),
              ),
            )
          : AppBar(
              title: Text(_currentIndex == 1 ? 'Pesanan Saya' : 'Akun & Admin'),
            ),
      body: _currentIndex == 0
          ? _buildCatalogBody()
          : _currentIndex == 1
          ? const OrderHistoryPage()
          : const AccountPage(),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        selectedItemColor: AppColors.deepRose,
        unselectedItemColor: AppColors.mediumGray,
        backgroundColor: AppColors.pureWhite,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(LucideIcons.house),
            activeIcon: Icon(LucideIcons.house),
            label: 'Beranda',
          ),
          BottomNavigationBarItem(
            icon: Icon(LucideIcons.package),
            activeIcon: Icon(LucideIcons.packageCheck),
            label: 'Pesanan Saya',
          ),
          BottomNavigationBarItem(
            icon: Icon(LucideIcons.userRound),
            activeIcon: Icon(LucideIcons.userRound),
            label: 'Akun & Admin',
          ),
        ],
      ),
    );
  }

  Widget _buildCatalogBody() {
    return SingleChildScrollView(
      controller: _scrollController,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          HeroBanner(onShopPressed: _scrollToFeaturedProducts),
          Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 1280),
              child: SizedBox(
                width: double.infinity,
                child: LayoutBuilder(
                  builder: (context, constraints) {
                    final horizontalPadding = constraints.maxWidth < 640
                        ? 16.0
                        : constraints.maxWidth < 1024
                        ? 24.0
                        : 32.0;

                    return Padding(
                      padding: EdgeInsets.fromLTRB(
                        horizontalPadding,
                        28,
                        horizontalPadding,
                        56,
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Kategori Produk',
                            style: Theme.of(context).textTheme.titleLarge,
                          ),
                          const SizedBox(height: 12),
                          CategoryChips(
                            categories: _categories,
                            selectedCategory: _selectedCategory,
                            onSelected: (category) {
                              setState(() => _selectedCategory = category);
                            },
                          ),
                          const SizedBox(height: 36),
                          _FeaturedSectionHeader(
                            key: _featuredSectionKey,
                            onViewAllPressed: () {
                              setState(() => _selectedCategory = 'Semua');
                            },
                          ),
                          const SizedBox(height: 18),
                          _ProductsGrid(
                            products: _visibleProducts,
                            onProductPressed: _openProduct,
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _openSearch() async {
    final product = await showSearch<ProductPreview?>(
      context: context,
      delegate: _ProductSearchDelegate(_products),
    );
    if (product != null && mounted) {
      await _openProduct(product);
    }
  }

  void _scrollToFeaturedProducts() {
    final featuredContext = _featuredSectionKey.currentContext;
    if (featuredContext == null) {
      return;
    }

    Scrollable.ensureVisible(
      featuredContext,
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeOut,
      alignment: 0.08,
    );
  }

  Future<void> _openProduct(ProductPreview product) async {
    final wasAdded = await Navigator.push<bool>(
      context,
      MaterialPageRoute(builder: (_) => ProductDetailPage(product: product)),
    );
    if (wasAdded == true && mounted) {
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(
          SnackBar(
            content: Text('${product.name} ditambahkan ke keranjang'),
            behavior: SnackBarBehavior.floating,
            duration: const Duration(seconds: 2),
          ),
        );
    }
  }
}

class _FeaturedSectionHeader extends StatelessWidget {
  const _FeaturedSectionHeader({required this.onViewAllPressed, super.key});

  final VoidCallback onViewAllPressed;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final isMobile = constraints.maxWidth < 640;

        return Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Produk Unggulan',
                    style: Theme.of(context).textTheme.displayMedium,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Pilihan favorit untuk momen yang terasa lebih personal.',
                    maxLines: isMobile ? 2 : 1,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.mediumGray,
                    ),
                  ),
                ],
              ),
            ),
            if (isMobile)
              IconButton(
                tooltip: 'Lihat semua produk',
                onPressed: onViewAllPressed,
                icon: const Icon(LucideIcons.chevronRight),
              )
            else
              TextButton.icon(
                onPressed: onViewAllPressed,
                iconAlignment: IconAlignment.end,
                icon: const Icon(LucideIcons.chevronRight, size: 17),
                label: const Text('Lihat Semua'),
              ),
          ],
        );
      },
    );
  }
}

class _ProductsGrid extends StatelessWidget {
  const _ProductsGrid({required this.products, required this.onProductPressed});

  final List<ProductPreview> products;
  final ValueChanged<ProductPreview> onProductPressed;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final columnCount = constraints.maxWidth >= 1024
            ? 4
            : constraints.maxWidth >= 640
            ? 3
            : 2;
        final spacing = constraints.maxWidth < 640 ? 12.0 : 20.0;
        final itemWidth =
            (constraints.maxWidth - (spacing * (columnCount - 1))) /
            columnCount;

        return GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: products.length,
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: columnCount,
            crossAxisSpacing: spacing,
            mainAxisSpacing: spacing,
            mainAxisExtent: itemWidth + 188,
          ),
          itemBuilder: (context, index) {
            final product = products[index];
            return ProductCard(
              product: product,
              onPressed: () => onProductPressed(product),
              onAddPressed: () => onProductPressed(product),
            );
          },
        );
      },
    );
  }
}

class _ProductSearchDelegate extends SearchDelegate<ProductPreview?> {
  _ProductSearchDelegate(this.products);

  final List<ProductPreview> products;

  @override
  String get searchFieldLabel => 'Cari bunga, kado, atau papan';

  @override
  List<Widget>? buildActions(BuildContext context) {
    return [
      if (query.isNotEmpty)
        IconButton(
          tooltip: 'Hapus pencarian',
          onPressed: () => query = '',
          icon: const Icon(LucideIcons.x),
        ),
    ];
  }

  @override
  Widget? buildLeading(BuildContext context) {
    return IconButton(
      tooltip: 'Kembali',
      onPressed: () => close(context, null),
      icon: const Icon(LucideIcons.arrowLeft),
    );
  }

  @override
  Widget buildResults(BuildContext context) => _buildResultList(context);

  @override
  Widget buildSuggestions(BuildContext context) => _buildResultList(context);

  Widget _buildResultList(BuildContext context) {
    final normalizedQuery = query.trim().toLowerCase();
    final results = normalizedQuery.isEmpty
        ? products
        : products.where((product) {
            return product.name.toLowerCase().contains(normalizedQuery) ||
                product.category.toLowerCase().contains(normalizedQuery);
          }).toList();

    if (results.isEmpty) {
      return Center(
        child: Text(
          'Produk tidak ditemukan',
          style: Theme.of(context).textTheme.titleMedium,
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: results.length,
      separatorBuilder: (_, _) => const Divider(),
      itemBuilder: (context, index) {
        final product = results[index];
        return ListTile(
          minTileHeight: 56,
          leading: const Icon(
            LucideIcons.flower2,
            color: AppColors.primaryPink,
          ),
          title: Text(product.name),
          subtitle: Text(product.category),
          trailing: const Icon(LucideIcons.chevronRight, size: 18),
          onTap: () => close(context, product),
        );
      },
    );
  }
}
