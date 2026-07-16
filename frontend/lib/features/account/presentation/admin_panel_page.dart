import 'package:flutter/material.dart';
import 'package:florist_frontend/core/currency_formatter.dart';
import 'package:florist_frontend/core/order_state.dart';
import 'package:florist_frontend/core/theme.dart';
import 'package:florist_frontend/features/home/presentation/widgets/product_artwork.dart';
import 'package:lucide_flutter/lucide_flutter.dart';

class AdminPanelPage extends StatelessWidget {
  const AdminPanelPage({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          leading: IconButton(
            tooltip: 'Kembali',
            onPressed: () => Navigator.pop(context),
            icon: const Icon(LucideIcons.arrowLeft),
          ),
          title: const Text('Panel Admin Simulator'),
          bottom: const TabBar(
            tabs: [
              Tab(text: 'Antrean Verifikasi'),
              Tab(text: 'Semua Pesanan'),
            ],
          ),
        ),
        body: ValueListenableBuilder<List<OrderModel>>(
          valueListenable: orderNotifier,
          builder: (context, orders, _) {
            final pending = orders
                .where(
                  (order) => order.status == OrderStatuses.waitingVerification,
                )
                .toList();
            return TabBarView(
              children: [
                _OrderList(orders: pending, isQueue: true),
                _OrderList(orders: orders, isQueue: false),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _OrderList extends StatelessWidget {
  const _OrderList({required this.orders, required this.isQueue});

  final List<OrderModel> orders;
  final bool isQueue;

  @override
  Widget build(BuildContext context) {
    if (orders.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                LucideIcons.inbox,
                size: 54,
                color: AppColors.primaryPink,
              ),
              const SizedBox(height: 14),
              Text(
                isQueue ? 'Antrean verifikasi kosong' : 'Belum ada pesanan',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.titleLarge,
              ),
            ],
          ),
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(16, 18, 16, 32),
      itemCount: orders.length,
      separatorBuilder: (_, _) => const SizedBox(height: 12),
      itemBuilder: (context, index) => _AdminOrderCard(order: orders[index]),
    );
  }
}

class _AdminOrderCard extends StatelessWidget {
  const _AdminOrderCard({required this.order});

  final OrderModel order;

  @override
  Widget build(BuildContext context) {
    final item = order.items.isEmpty ? null : order.items.first;
    return Card(
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
                Text(
                  order.status,
                  style: Theme.of(context).textTheme.labelSmall,
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                if (item != null)
                  ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: SizedBox.square(
                      dimension: 54,
                      child: ProductArtwork(product: item.product),
                    ),
                  ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    item == null
                        ? 'Pesanan kosong'
                        : '${item.product.name} x${item.quantity}',
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.titleSmall,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            _AdminInfoRow(label: 'Pelanggan', value: order.recipientName),
            _AdminInfoRow(label: 'Pengiriman', value: order.deliveryType),
            _AdminInfoRow(label: 'Alamat', value: order.address),
            _AdminInfoRow(
              label: 'Nominal transfer DP',
              value: formatRupiah((order.total / 2).ceil()),
            ),
            const SizedBox(height: 10),
            Container(
              height: 110,
              width: double.infinity,
              decoration: BoxDecoration(
                color: AppColors.blushRose,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.softPink),
              ),
              child: const Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    LucideIcons.image,
                    size: 30,
                    color: AppColors.primaryPink,
                  ),
                  SizedBox(height: 6),
                  Text('simulasi-bukti-transfer.jpg'),
                ],
              ),
            ),
            const SizedBox(height: 6),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton.icon(
                onPressed: () => _showOrderDetail(context),
                icon: const Icon(LucideIcons.fileSearch, size: 17),
                label: const Text('Lihat Detail Pesanan'),
              ),
            ),
            if (order.status == OrderStatuses.waitingVerification) ...[
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: FilledButton.icon(
                      key: ValueKey('approve-${order.orderId}'),
                      onPressed: () =>
                          _updateStatus(context, OrderStatuses.processing),
                      icon: const Icon(LucideIcons.check, size: 18),
                      label: const Text('Setujui Pembayaran'),
                      style: FilledButton.styleFrom(
                        backgroundColor: AppColors.success,
                        padding: const EdgeInsets.symmetric(horizontal: 10),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: OutlinedButton.icon(
                      key: ValueKey('reject-${order.orderId}'),
                      onPressed: () =>
                          _updateStatus(context, OrderStatuses.rejected),
                      icon: const Icon(LucideIcons.x, size: 18),
                      label: const Text('Tolak Pembayaran'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.error,
                        side: const BorderSide(color: AppColors.error),
                        padding: const EdgeInsets.symmetric(horizontal: 10),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  void _updateStatus(BuildContext context, String status) {
    orderNotifier.updateOrderStatus(order.orderId, status);
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          content: Text(
            status == OrderStatuses.processing
                ? 'Pembayaran disetujui. Pesanan masuk proses.'
                : 'Pembayaran ditolak dan stok dibebaskan.',
          ),
          behavior: SnackBarBehavior.floating,
        ),
      );
  }

  void _showOrderDetail(BuildContext context) {
    showDialog<void>(
      context: context,
      builder: (_) => _AdminOrderDetailDialog(order: order),
    );
  }
}

class _AdminOrderDetailDialog extends StatelessWidget {
  const _AdminOrderDetailDialog({required this.order});

  final OrderModel order;

  @override
  Widget build(BuildContext context) {
    final dpAmount = (order.total / 2).ceil();

    return Dialog(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 560, maxHeight: 720),
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 18, 20, 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      'Detail Verifikasi',
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
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: AppColors.deepRose,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 18),
              _AdminDetailSection(
                title: 'Data Pengiriman',
                icon: LucideIcons.truck,
                children: [
                  _AdminInfoRow(label: 'Penerima', value: order.recipientName),
                  _AdminInfoRow(label: 'Telepon / WA', value: order.phone),
                  _AdminInfoRow(label: 'Jenis', value: order.deliveryType),
                  _AdminInfoRow(label: 'Alamat', value: order.address),
                ],
              ),
              const SizedBox(height: 16),
              _AdminDetailSection(
                title: 'Ringkasan Pembayaran',
                icon: LucideIcons.walletCards,
                children: [
                  _AdminInfoRow(
                    label: 'Total pesanan',
                    value: formatRupiah(order.total),
                  ),
                  _AdminInfoRow(
                    label: 'Nominal transfer DP',
                    value: formatRupiah(dpAmount),
                  ),
                  _AdminInfoRow(label: 'Status', value: order.status),
                ],
              ),
              const SizedBox(height: 16),
              _AdminDetailSection(
                title: 'Produk',
                icon: LucideIcons.package,
                children: [
                  ...order.items.map(
                    (item) => _AdminInfoRow(
                      label: '${item.product.name} x${item.quantity}',
                      value: formatRupiah(item.lineTotal),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Text(
                'Bukti Transfer (Simulasi)',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 8),
              Container(
                height: 150,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: AppColors.blushRose,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.softPink),
                ),
                child: const Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      LucideIcons.image,
                      size: 34,
                      color: AppColors.primaryPink,
                    ),
                    SizedBox(height: 8),
                    Text('simulasi-bukti-transfer.jpg'),
                  ],
                ),
              ),
              if (order.status == OrderStatuses.waitingVerification) ...[
                const SizedBox(height: 18),
                Row(
                  children: [
                    Expanded(
                      child: FilledButton.icon(
                        onPressed: () =>
                            _changeStatus(context, OrderStatuses.processing),
                        icon: const Icon(LucideIcons.check, size: 18),
                        label: const Text('Setujui Pembayaran'),
                        style: FilledButton.styleFrom(
                          backgroundColor: AppColors.success,
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () =>
                            _changeStatus(context, OrderStatuses.rejected),
                        icon: const Icon(LucideIcons.x, size: 18),
                        label: const Text('Tolak Pembayaran'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.error,
                          side: const BorderSide(color: AppColors.error),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  void _changeStatus(BuildContext context, String status) {
    orderNotifier.updateOrderStatus(order.orderId, status);
    Navigator.pop(context);
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          content: Text(
            status == OrderStatuses.processing
                ? 'Pembayaran disetujui. Pesanan masuk proses.'
                : 'Pembayaran ditolak dan stok dibebaskan.',
          ),
          behavior: SnackBarBehavior.floating,
        ),
      );
  }
}

class _AdminDetailSection extends StatelessWidget {
  const _AdminDetailSection({
    required this.title,
    required this.icon,
    required this.children,
  });

  final String title;
  final IconData icon;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.offWhite,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.lightGray),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 18, color: AppColors.deepRose),
              const SizedBox(width: 8),
              Text(title, style: Theme.of(context).textTheme.titleSmall),
            ],
          ),
          const SizedBox(height: 10),
          ...children,
        ],
      ),
    );
  }
}

class _AdminInfoRow extends StatelessWidget {
  const _AdminInfoRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 132,
            child: Text(label, style: Theme.of(context).textTheme.bodySmall),
          ),
          Expanded(
            child: Text(value, style: Theme.of(context).textTheme.bodySmall),
          ),
        ],
      ),
    );
  }
}
