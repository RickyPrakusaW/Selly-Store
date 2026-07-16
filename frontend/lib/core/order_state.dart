import 'package:flutter/foundation.dart';
import 'package:florist_frontend/core/cart_state.dart';

abstract final class OrderStatuses {
  static const waitingVerification = 'Menunggu Verifikasi';
  static const processing = 'Diproses';
  static const completed = 'Selesai';
  static const rejected = 'Ditolak';

  static const all = <String>[
    waitingVerification,
    processing,
    completed,
    rejected,
  ];
}

@immutable
class OrderModel {
  const OrderModel({
    required this.orderId,
    required this.items,
    required this.total,
    required this.status,
    required this.createdAt,
    required this.recipientName,
    required this.phone,
    required this.address,
    required this.deliveryType,
  });

  final String orderId;
  final List<CartItem> items;
  final int total;
  final String status;
  final DateTime createdAt;
  final String recipientName;
  final String phone;
  final String address;
  final String deliveryType;

  OrderModel copyWith({String? status, List<CartItem>? items, int? total}) {
    return OrderModel(
      orderId: orderId,
      items: items ?? this.items,
      total: total ?? this.total,
      status: status ?? this.status,
      createdAt: createdAt,
      recipientName: recipientName,
      phone: phone,
      address: address,
      deliveryType: deliveryType,
    );
  }
}

class OrderNotifier extends ValueNotifier<List<OrderModel>> {
  OrderNotifier() : super(const []);

  void createOrder(OrderModel order) {
    value = List.unmodifiable([order, ...value]);
  }

  void updateOrderStatus(String orderId, String newStatus) {
    if (!OrderStatuses.all.contains(newStatus)) {
      return;
    }

    final index = value.indexWhere((order) => order.orderId == orderId);
    if (index < 0) {
      return;
    }

    final orders = List<OrderModel>.of(value);
    orders[index] = orders[index].copyWith(status: newStatus);
    value = List.unmodifiable(orders);
  }

  void clearOrders() {
    value = const [];
  }
}

final orderNotifier = OrderNotifier();
