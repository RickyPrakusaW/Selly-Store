import 'package:flutter/material.dart';
import 'package:florist_frontend/core/currency_formatter.dart';
import 'package:florist_frontend/core/order_state.dart';
import 'package:florist_frontend/core/theme.dart';
import 'package:florist_frontend/features/home/presentation/widgets/product_artwork.dart';
import 'package:lucide_flutter/lucide_flutter.dart';

class OrderHistoryPage extends StatelessWidget {
  const OrderHistoryPage({super.key});

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<List<OrderModel>>(
      valueListenable: orderNotifier,
      builder: (context, orders, _) {
        if (orders.isEmpty) {
          return const _EmptyOrders();
        }

        return ListView.separated(
          padding: const EdgeInsets.fromLTRB(16, 20, 16, 32),
          itemCount: orders.length,
          separatorBuilder: (_, _) => const SizedBox(height: 12),
          itemBuilder: (context, index) {
            final order = orders[index];
            return _OrderCard(
              order: order,
              onTap: () => _showOrderDetail(context, order),
            );
          },
        );
      },
    );
  }

  Future<void> _showOrderDetail(BuildContext context, OrderModel order) {
    return showDialog<void>(
      context: context,
      builder: (_) => _OrderDetailDialog(order: order),
    );
  }
}

class _EmptyOrders extends StatelessWidget {
  const _EmptyOrders();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 104,
              height: 104,
              decoration: const BoxDecoration(
                color: AppColors.blushRose,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                LucideIcons.flower2,
                size: 48,
                color: AppColors.deepRose,
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'Belum ada pesanan',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.displaySmall,
            ),
            const SizedBox(height: 8),
            Text(
              'Pesanan yang kamu buat akan muncul di sini.',
              textAlign: TextAlign.center,
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: AppColors.mediumGray),
            ),
          ],
        ),
      ),
    );
  }
}

class _OrderCard extends StatelessWidget {
  const _OrderCard({required this.order, required this.onTap});

  final OrderModel order;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final itemCount = order.items.fold(0, (sum, item) => sum + item.quantity);
    final firstItem = order.items.firstOrNull;
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      order.orderId,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: AppColors.deepRose,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  _StatusBadge(status: order.status),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                _formatDate(order.createdAt),
                style: Theme.of(
                  context,
                ).textTheme.bodySmall?.copyWith(color: AppColors.mediumGray),
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  if (firstItem != null)
                    ClipRRect(
                      borderRadius: BorderRadius.circular(10),
                      child: SizedBox.square(
                        dimension: 54,
                        child: ProductArtwork(product: firstItem.product),
                      ),
                    ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      firstItem == null
                          ? 'Pesanan'
                          : '${firstItem.product.name}${itemCount > 1 ? ' + ${itemCount - 1} item' : ''}',
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.titleSmall,
                    ),
                  ),
                  const Icon(
                    LucideIcons.chevronRight,
                    size: 18,
                    color: AppColors.mediumGray,
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: Text(
                      'Total Harga',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ),
                  Text(
                    formatRupiah(order.total),
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      color: AppColors.deepRose,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'Mei',
      'Jun',
      'Jul',
      'Agu',
      'Sep',
      'Okt',
      'Nov',
      'Des',
    ];
    return '${date.day} ${months[date.month - 1]} ${date.year}';
  }
}

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    final (background, foreground, icon) = switch (status) {
      OrderStatuses.processing => (
        AppColors.lavenderMist,
        AppColors.info,
        LucideIcons.packageCheck,
      ),
      OrderStatuses.completed => (
        AppColors.readyStockBackground,
        AppColors.readyStockText,
        LucideIcons.circleCheck,
      ),
      OrderStatuses.rejected => (
        const Color(0xFFFEE2E2),
        AppColors.error,
        LucideIcons.circleX,
      ),
      _ => (
        AppColors.preOrderBackground,
        AppColors.preOrderText,
        LucideIcons.clock3,
      ),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 6),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: foreground),
          const SizedBox(width: 5),
          Text(
            status,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: foreground,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class _OrderDetailDialog extends StatelessWidget {
  const _OrderDetailDialog({required this.order});

  final OrderModel order;

  @override
  Widget build(BuildContext context) {
    return Dialog(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 540, maxHeight: 720),
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 18, 20, 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      'Detail Pesanan',
                      style: Theme.of(context).textTheme.headlineSmall,
                    ),
                  ),
                  IconButton(
                    tooltip: 'Tutup',
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(LucideIcons.x),
                  ),
                ],
              ),
              Text(
                order.orderId,
                style: Theme.of(
                  context,
                ).textTheme.titleMedium?.copyWith(color: AppColors.deepRose),
              ),
              const SizedBox(height: 18),
              Text(
                'Timeline Status',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 14),
              _OrderTimeline(status: order.status),
              const Divider(height: 30),
              Text('Produk', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              ...order.items.map(
                (item) => Padding(
                  padding: const EdgeInsets.only(bottom: 7),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text('${item.product.name} x${item.quantity}'),
                      ),
                      Text(formatRupiah(item.lineTotal)),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                '${order.deliveryType} - ${order.recipientName}',
                style: Theme.of(context).textTheme.bodySmall,
              ),
              Text(
                '${order.phone} | ${order.address}',
                style: Theme.of(context).textTheme.bodySmall,
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: Text(
                      'Total',
                      style: Theme.of(context).textTheme.titleSmall,
                    ),
                  ),
                  Text(
                    formatRupiah(order.total),
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: AppColors.deepRose,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _OrderTimeline extends StatelessWidget {
  const _OrderTimeline({required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    const labels = [
      'Order Dibuat',
      'Bukti Bayar Diunggah',
      'Diverifikasi Admin',
      'Diproses',
      'Selesai',
    ];
    final currentIndex = switch (status) {
      OrderStatuses.processing => 3,
      OrderStatuses.completed => 4,
      OrderStatuses.rejected => 2,
      _ => 1,
    };

    return Column(
      children: List.generate(labels.length, (index) {
        final active =
            index <= currentIndex && status != OrderStatuses.rejected;
        final rejected = status == OrderStatuses.rejected && index == 2;
        final color = rejected
            ? AppColors.error
            : active
            ? AppColors.primaryPink
            : AppColors.lightGray;
        return Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              width: 28,
              child: Column(
                children: [
                  Container(
                    width: 15,
                    height: 15,
                    decoration: BoxDecoration(
                      color: color,
                      shape: BoxShape.circle,
                    ),
                    child: (active || rejected)
                        ? Icon(
                            rejected ? LucideIcons.x : LucideIcons.check,
                            size: 10,
                            color: AppColors.pureWhite,
                          )
                        : null,
                  ),
                  if (index < labels.length - 1)
                    Container(width: 2, height: 30, color: color),
                ],
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.only(top: 0, bottom: 16),
                child: Text(
                  rejected && index == 2 ? 'Pembayaran Ditolak' : labels[index],
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: rejected && index == 2 ? AppColors.error : null,
                    fontWeight: active || rejected
                        ? FontWeight.w700
                        : FontWeight.w400,
                  ),
                ),
              ),
            ),
          ],
        );
      }),
    );
  }
}
