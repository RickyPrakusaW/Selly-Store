import 'package:dio/dio.dart';
import 'package:florist_frontend/core/api_client.dart';
import 'package:florist_frontend/features/home/domain/product_preview.dart';

class CatalogCategory {
  const CatalogCategory({
    required this.id,
    required this.slug,
    required this.name,
  });

  factory CatalogCategory.fromJson(Map<String, dynamic> json) {
    return CatalogCategory(
      id: json['id']?.toString() ?? '',
      slug: json['slug']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Kategori',
    );
  }

  final String id;
  final String slug;
  final String name;
}

abstract interface class CatalogRepository {
  Future<List<CatalogCategory>> fetchCategories();
  Future<List<ProductPreview>> fetchProducts({String? categorySlug});
}

class DioCatalogRepository implements CatalogRepository {
  DioCatalogRepository(this._dio);

  final Dio _dio;

  @override
  Future<List<CatalogCategory>> fetchCategories() async {
    try {
      final response = await _dio.get<Map<String, dynamic>>('/categories');
      return _listData(response.data)
          .map((json) => CatalogCategory.fromJson(json))
          .where((category) => category.slug.isNotEmpty)
          .toList(growable: false);
    } catch (error) {
      throw ApiException.from(error);
    }
  }

  @override
  Future<List<ProductPreview>> fetchProducts({String? categorySlug}) async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(
        '/products',
        queryParameters: {
          'page': 1,
          'limit': 20,
          if (categorySlug != null && categorySlug.isNotEmpty)
            'category': categorySlug,
        },
      );
      return _listData(
        response.data,
      ).map((json) => ProductPreview.fromJson(json)).toList(growable: false);
    } catch (error) {
      throw ApiException.from(error);
    }
  }

  List<Map<String, dynamic>> _listData(Map<String, dynamic>? body) {
    final data = body?['data'];
    if (data is! List) {
      throw const ApiException('Daftar produk dari server tidak valid.');
    }
    return data
        .whereType<Map>()
        .map((item) => Map<String, dynamic>.from(item))
        .toList(growable: false);
  }
}

final catalogRepository = DioCatalogRepository(apiClient.dio);
