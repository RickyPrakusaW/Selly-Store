import 'package:flutter/material.dart';
import 'package:florist_frontend/features/home/domain/product_preview.dart';

class CartItem {
  const CartItem({
    required this.product,
    required this.variant,
    required this.customNote,
    required this.bookingDate,
    required this.quantity,
  });

  final ProductPreview product;
  final String variant;
  final String customNote;
  final DateTime? bookingDate;
  final int quantity;

  int get unitPrice {
    final variantAddition = switch (variant) {
      'Medium' => 50000,
      'Premium' => 100000,
      _ => 0,
    };

    return product.price + variantAddition;
  }

  int get lineTotal => unitPrice * quantity;

  CartItem copyWith({int? quantity}) {
    return CartItem(
      product: product,
      variant: variant,
      customNote: customNote,
      bookingDate: bookingDate,
      quantity: quantity ?? this.quantity,
    );
  }

  bool hasSameConfiguration(CartItem other) {
    return product == other.product &&
        variant == other.variant &&
        customNote.trim() == other.customNote.trim() &&
        DateUtils.isSameDay(bookingDate, other.bookingDate);
  }
}

class CartNotifier extends ValueNotifier<List<CartItem>> {
  CartNotifier() : super(const []);

  static const deliveryFee = 15000;

  bool _isDelivery = true;

  bool get isDelivery => _isDelivery;

  int get totalQuantity {
    return value.fold(0, (total, item) => total + item.quantity);
  }

  int get subtotal {
    return value.fold(0, (total, item) => total + item.lineTotal);
  }

  int get ongkir => _isDelivery && value.isNotEmpty ? deliveryFee : 0;

  int get total => subtotal + ongkir;

  int get downPayment => (total / 2).ceil();

  int get remainingPayment => total - downPayment;

  void addItem(CartItem item) {
    if (item.quantity < 1) {
      return;
    }

    final items = List<CartItem>.of(value);
    final existingIndex = items.indexWhere(item.hasSameConfiguration);
    if (existingIndex >= 0) {
      final existing = items[existingIndex];
      items[existingIndex] = existing.copyWith(
        quantity: existing.quantity + item.quantity,
      );
    } else {
      items.add(item);
    }
    value = List.unmodifiable(items);
  }

  void removeItem(CartItem item) {
    final items = List<CartItem>.of(value);
    final itemIndex = _findItemIndex(items, item);
    if (itemIndex < 0) {
      return;
    }

    items.removeAt(itemIndex);
    value = List.unmodifiable(items);
  }

  void updateQuantity(CartItem item, int qty) {
    if (qty < 1) {
      removeItem(item);
      return;
    }

    final items = List<CartItem>.of(value);
    final itemIndex = _findItemIndex(items, item);
    if (itemIndex < 0) {
      return;
    }

    items[itemIndex] = items[itemIndex].copyWith(quantity: qty);
    value = List.unmodifiable(items);
  }

  void setDelivery(bool isDelivery) {
    if (_isDelivery == isDelivery) {
      return;
    }

    _isDelivery = isDelivery;
    value = List.unmodifiable(value);
  }

  void clearCart() {
    _isDelivery = true;
    value = const [];
  }

  int _findItemIndex(List<CartItem> items, CartItem target) {
    final identityIndex = items.indexWhere((item) => identical(item, target));
    if (identityIndex >= 0) {
      return identityIndex;
    }

    return items.indexWhere(target.hasSameConfiguration);
  }
}

final cartNotifier = CartNotifier();
