import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:florist_frontend/core/api_client.dart';
import 'package:florist_frontend/core/theme.dart';
import 'package:florist_frontend/features/home/data/catalog_repository.dart';
import 'package:florist_frontend/features/home/domain/product_preview.dart';
import 'package:florist_frontend/features/home/presentation/home_page.dart';

void main() {
  testWidgets('catalog renders loading and API product states', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light,
        home: HomePage(repository: _SuccessfulCatalogRepository()),
      ),
    );

    expect(find.byType(CircularProgressIndicator), findsOneWidget);
    await tester.pumpAndSettle();

    expect(find.text('Buket API'), findsOneWidget);
    expect(find.text('Rp 185.000'), findsOneWidget);
    expect(find.text('Ready Stock'), findsOneWidget);
  });

  testWidgets('catalog shows a retry action after an API error', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light,
        home: HomePage(repository: _FailingCatalogRepository()),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Backend katalog tidak tersedia.'), findsOneWidget);
    expect(find.byKey(const ValueKey('retry-catalog')), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}

class _SuccessfulCatalogRepository implements CatalogRepository {
  @override
  Future<List<CatalogCategory>> fetchCategories() async {
    await Future<void>.delayed(Duration.zero);
    return const [
      CatalogCategory(id: 'category-id', slug: 'bunga', name: 'Bunga'),
    ];
  }

  @override
  Future<List<ProductPreview>> fetchProducts({String? categorySlug}) async {
    await Future<void>.delayed(Duration.zero);
    return const [
      ProductPreview(
        id: 'product-id',
        name: 'Buket API',
        category: 'Bunga',
        categorySlug: 'bunga',
        price: 185000,
        stockStatus: ProductStockStatus.readyStock,
        visual: ProductVisual.bouquet,
        availableQty: 4,
      ),
    ];
  }
}

class _FailingCatalogRepository implements CatalogRepository {
  @override
  Future<List<CatalogCategory>> fetchCategories() async {
    throw const ApiException('Backend katalog tidak tersedia.');
  }

  @override
  Future<List<ProductPreview>> fetchProducts({String? categorySlug}) async {
    throw const ApiException('Backend katalog tidak tersedia.');
  }
}
