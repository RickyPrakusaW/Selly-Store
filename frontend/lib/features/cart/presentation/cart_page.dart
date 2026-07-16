import 'package:flutter/material.dart';
import 'package:florist_frontend/core/cart_state.dart';
import 'package:florist_frontend/core/currency_formatter.dart';
import 'package:florist_frontend/core/theme.dart';
import 'package:florist_frontend/features/home/presentation/widgets/product_artwork.dart';
import 'package:lucide_flutter/lucide_flutter.dart';

class CartPage extends StatelessWidget {
  const CartPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          tooltip: 'Kembali',
          onPressed: () => _goBack(context),
          icon: const Icon(LucideIcons.arrowLeft),
        ),
        title: const Text('Keranjang Belanja'),
      ),
      body: ValueListenableBuilder<List<CartItem>>(
        valueListenable: cartNotifier,
        builder: (context, items, _) {
          if (items.isEmpty) {
            return _EmptyCart(onShopPressed: () => _goHome(context));
          }

          return SafeArea(
            bottom: false,
            child: LayoutBuilder(
              builder: (context, constraints) {
                final contentWidth = constraints.maxWidth > 960
                    ? 960.0
                    : constraints.maxWidth;
                return Center(
                  child: SizedBox(
                    width: contentWidth,
                    height: constraints.maxHeight,
                    child: ListView(
                      padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
                      children: [
                        Text(
                          '${cartNotifier.totalQuantity} produk pilihan',
                          style: Theme.of(context).textTheme.bodyMedium
                              ?.copyWith(color: AppColors.mediumGray),
                        ),
                        const SizedBox(height: 12),
                        ...items.map(
                          (item) => Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: _CartItemCard(item: item),
                          ),
                        ),
                        const SizedBox(height: 16),
                        const _PriceSummary(),
                      ],
                    ),
                  ),
                );
              },
            ),
          );
        },
      ),
      bottomNavigationBar: ValueListenableBuilder<List<CartItem>>(
        valueListenable: cartNotifier,
        builder: (context, items, _) {
          if (items.isEmpty) {
            return const SizedBox.shrink();
          }

          return SafeArea(
            top: false,
            child: Container(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
              decoration: BoxDecoration(
                color: AppColors.pureWhite,
                border: const Border(
                  top: BorderSide(color: AppColors.lightGray),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.06),
                    blurRadius: 20,
                    offset: const Offset(0, -4),
                  ),
                ],
              ),
              child: Center(
                heightFactor: 1,
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 928),
                  child: SizedBox(
                    width: double.infinity,
                    child: FilledButton.icon(
                      key: const ValueKey('continue-to-checkout'),
                      onPressed: () =>
                          Navigator.pushNamed(context, '/checkout'),
                      iconAlignment: IconAlignment.end,
                      icon: const Icon(LucideIcons.arrowRight, size: 19),
                      label: Text(
                        'Lanjut ke Pembayaran - '
                        '${formatRupiah(cartNotifier.downPayment)}',
                      ),
                      style: FilledButton.styleFrom(
                        minimumSize: const Size.fromHeight(52),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  void _goBack(BuildContext context) {
    if (Navigator.canPop(context)) {
      Navigator.pop(context);
    } else {
      Navigator.pushReplacementNamed(context, '/');
    }
  }

  void _goHome(BuildContext context) {
    Navigator.pushNamedAndRemoveUntil(context, '/', (route) => false);
  }
}

class _CartItemCard extends StatelessWidget {
  const _CartItemCard({required this.item});

  final CartItem item;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.pureWhite,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.lightGray),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: SizedBox.square(
                  dimension: 76,
                  child: ProductArtwork(product: item.product),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.product.name,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Varian ${item.variant}',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                    if (item.bookingDate != null) ...[
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          const Icon(
                            LucideIcons.calendarDays,
                            size: 14,
                            color: AppColors.deepRose,
                          ),
                          const SizedBox(width: 5),
                          Expanded(
                            child: Text(
                              _formatDate(item.bookingDate!),
                              style: Theme.of(context).textTheme.bodySmall
                                  ?.copyWith(color: AppColors.deepRose),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
              IconButton(
                tooltip: 'Hapus produk',
                onPressed: () => cartNotifier.removeItem(item),
                icon: const Icon(LucideIcons.trash2, size: 19),
                color: AppColors.error,
              ),
            ],
          ),
          if (item.customNote.isNotEmpty) ...[
            const SizedBox(height: 10),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.offWhite,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                'Catatan: ${item.customNote}',
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ),
          ],
          const SizedBox(height: 12),
          Row(
            children: [
              _CompactQuantityStepper(item: item),
              const Spacer(),
              Flexible(
                child: Text(
                  formatRupiah(item.lineTotal),
                  textAlign: TextAlign.end,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: AppColors.deepRose,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
        ],
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

class _CompactQuantityStepper extends StatelessWidget {
  const _CompactQuantityStepper({required this.item});

  final CartItem item;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 44,
      decoration: BoxDecoration(
        color: AppColors.offWhite,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: AppColors.softPink),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          IconButton(
            key: ValueKey('cart-decrease-${item.product.name}-${item.variant}'),
            tooltip: 'Kurangi jumlah',
            onPressed: () {
              cartNotifier.updateQuantity(item, item.quantity - 1);
            },
            icon: const Icon(LucideIcons.minus, size: 16),
            visualDensity: VisualDensity.compact,
          ),
          SizedBox(
            width: 24,
            child: Text(
              '${item.quantity}',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.labelLarge,
            ),
          ),
          IconButton(
            key: ValueKey('cart-increase-${item.product.name}-${item.variant}'),
            tooltip: 'Tambah jumlah',
            onPressed: () {
              cartNotifier.updateQuantity(item, item.quantity + 1);
            },
            icon: const Icon(LucideIcons.plus, size: 16),
            visualDensity: VisualDensity.compact,
          ),
        ],
      ),
    );
  }
}

class _PriceSummary extends StatelessWidget {
  const _PriceSummary();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.offWhite,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.blushRose),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Rincian Harga', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 16),
          _SummaryRow(
            label: 'Subtotal',
            value: formatRupiah(cartNotifier.subtotal),
          ),
          const SizedBox(height: 10),
          _SummaryRow(
            label: 'Ongkir',
            value: formatRupiah(cartNotifier.ongkir),
          ),
          const SizedBox(height: 10),
          _SummaryRow(
            label: 'Total Pesanan',
            value: formatRupiah(cartNotifier.total),
          ),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 14),
            child: Divider(height: 1),
          ),
          _SummaryRow(
            label: 'Sisa Pembayaran Pelunasan',
            value: formatRupiah(cartNotifier.remainingPayment),
          ),
          const SizedBox(height: 10),
          _SummaryRow(
            label: 'Total DP 50%',
            value: formatRupiah(cartNotifier.downPayment),
            emphasized: true,
          ),
        ],
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  const _SummaryRow({
    required this.label,
    required this.value,
    this.emphasized = false,
  });

  final String label;
  final String value;
  final bool emphasized;

  @override
  Widget build(BuildContext context) {
    final style = emphasized
        ? Theme.of(context).textTheme.titleMedium?.copyWith(
            color: AppColors.deepRose,
            fontWeight: FontWeight.w700,
          )
        : Theme.of(context).textTheme.bodyMedium;

    return Row(
      children: [
        Expanded(child: Text(label, style: style)),
        const SizedBox(width: 12),
        Text(value, style: style, textAlign: TextAlign.end),
      ],
    );
  }
}

class _EmptyCart extends StatelessWidget {
  const _EmptyCart({required this.onShopPressed});

  final VoidCallback onShopPressed;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 112,
              height: 112,
              decoration: const BoxDecoration(
                color: AppColors.blushRose,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                LucideIcons.shoppingBasket,
                size: 50,
                color: AppColors.deepRose,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'Keranjang kamu masih kosong',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.displaySmall,
            ),
            const SizedBox(height: 8),
            Text(
              'Temukan bunga dan hadiah yang pas untuk momen spesialmu.',
              textAlign: TextAlign.center,
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: AppColors.mediumGray),
            ),
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: onShopPressed,
              icon: const Icon(LucideIcons.flower2, size: 19),
              label: const Text('Kembali ke Katalog'),
            ),
          ],
        ),
      ),
    );
  }
}
