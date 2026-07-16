import 'package:flutter/material.dart';
import 'package:florist_frontend/core/cart_state.dart';
import 'package:florist_frontend/core/currency_formatter.dart';
import 'package:florist_frontend/core/theme.dart';
import 'package:florist_frontend/features/home/domain/product_preview.dart';
import 'package:florist_frontend/features/home/presentation/widgets/product_artwork.dart';
import 'package:lucide_flutter/lucide_flutter.dart';

class ProductDetailPage extends StatefulWidget {
  const ProductDetailPage({required this.product, super.key});

  final ProductPreview product;

  @override
  State<ProductDetailPage> createState() => _ProductDetailPageState();
}

class _ProductDetailPageState extends State<ProductDetailPage> {
  static const _variants = ['Standar', 'Medium', 'Premium'];

  final _noteController = TextEditingController();
  var _selectedVariant = _variants.first;
  var _quantity = 1;
  DateTime? _bookingDate;

  bool get _requiresBookingDate => widget.product.category == 'Papan Sewa';

  bool get _canAddToCart => !_requiresBookingDate || _bookingDate != null;

  int get _selectedUnitPrice {
    return CartItem(
      product: widget.product,
      variant: _selectedVariant,
      customNote: '',
      bookingDate: _bookingDate,
      quantity: 1,
    ).unitPrice;
  }

  @override
  void dispose() {
    _noteController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          tooltip: 'Kembali',
          onPressed: () => Navigator.pop(context),
          icon: const Icon(LucideIcons.arrowLeft),
        ),
        title: const Text('Detail Produk'),
      ),
      body: SafeArea(
        bottom: false,
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 1040),
              child: LayoutBuilder(
                builder: (context, constraints) {
                  final isDesktop = constraints.maxWidth >= 760;
                  final artwork = ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: AspectRatio(
                      aspectRatio: 1,
                      child: ProductArtwork(product: widget.product),
                    ),
                  );
                  final details = _ProductDetails(
                    product: widget.product,
                    variants: _variants,
                    selectedVariant: _selectedVariant,
                    unitPrice: _selectedUnitPrice,
                    noteController: _noteController,
                    bookingDate: _bookingDate,
                    requiresBookingDate: _requiresBookingDate,
                    onVariantSelected: (variant) {
                      setState(() => _selectedVariant = variant);
                    },
                    onBookingPressed: _selectBookingDate,
                  );

                  if (isDesktop) {
                    return Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(child: artwork),
                        const SizedBox(width: 40),
                        Expanded(child: details),
                      ],
                    );
                  }

                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [artwork, const SizedBox(height: 24), details],
                  );
                },
              ),
            ),
          ),
        ),
      ),
      bottomNavigationBar: SafeArea(
        top: false,
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: AppColors.pureWhite,
            border: const Border(top: BorderSide(color: AppColors.lightGray)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.06),
                blurRadius: 20,
                offset: const Offset(0, -4),
              ),
            ],
          ),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
            child: Center(
              heightFactor: 1,
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 1040),
                child: Row(
                  children: [
                    _QuantityStepper(
                      quantity: _quantity,
                      onDecrease: _quantity > 1
                          ? () => setState(() => _quantity--)
                          : null,
                      onIncrease: () => setState(() => _quantity++),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: FilledButton.icon(
                        key: const ValueKey('add-to-cart-detail'),
                        onPressed: _canAddToCart ? _addToCart : null,
                        icon: const Icon(LucideIcons.shoppingCart, size: 19),
                        label: const Text('Tambah ke Keranjang'),
                        style: FilledButton.styleFrom(
                          minimumSize: const Size.fromHeight(52),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _selectBookingDate() async {
    final today = DateUtils.dateOnly(DateTime.now());
    final selectedDate = await showDatePicker(
      context: context,
      initialDate: _bookingDate ?? today.add(const Duration(days: 1)),
      firstDate: today,
      lastDate: today.add(const Duration(days: 365)),
      helpText: 'Pilih tanggal booking',
      cancelText: 'Batal',
      confirmText: 'Pilih',
    );

    if (selectedDate != null && mounted) {
      setState(() => _bookingDate = selectedDate);
    }
  }

  void _addToCart() {
    if (!_canAddToCart) {
      return;
    }

    cartNotifier.addItem(
      CartItem(
        product: widget.product,
        variant: _selectedVariant,
        customNote: _noteController.text.trim(),
        bookingDate: _bookingDate,
        quantity: _quantity,
      ),
    );
    Navigator.pop(context, true);
  }
}

class _ProductDetails extends StatelessWidget {
  const _ProductDetails({
    required this.product,
    required this.variants,
    required this.selectedVariant,
    required this.unitPrice,
    required this.noteController,
    required this.bookingDate,
    required this.requiresBookingDate,
    required this.onVariantSelected,
    required this.onBookingPressed,
  });

  final ProductPreview product;
  final List<String> variants;
  final String selectedVariant;
  final int unitPrice;
  final TextEditingController noteController;
  final DateTime? bookingDate;
  final bool requiresBookingDate;
  final ValueChanged<String> onVariantSelected;
  final VoidCallback onBookingPressed;

  @override
  Widget build(BuildContext context) {
    final isReady = product.stockStatus == ProductStockStatus.readyStock;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            _PillLabel(
              text: product.category,
              backgroundColor: AppColors.blushRose,
              foregroundColor: AppColors.deepRose,
            ),
            _PillLabel(
              text: isReady ? 'Ready Stock' : 'Pre-Order',
              backgroundColor: isReady
                  ? AppColors.readyStockBackground
                  : AppColors.preOrderBackground,
              foregroundColor: isReady
                  ? AppColors.readyStockText
                  : AppColors.preOrderText,
            ),
          ],
        ),
        const SizedBox(height: 16),
        Text(product.name, style: Theme.of(context).textTheme.displayMedium),
        const SizedBox(height: 8),
        Text(
          formatRupiah(unitPrice),
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
            color: AppColors.deepRose,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 28),
        Text('Pilih Varian', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 10),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: variants.map((variant) {
            return ChoiceChip(
              label: Text(variant),
              selected: variant == selectedVariant,
              showCheckmark: false,
              onSelected: (_) => onVariantSelected(variant),
            );
          }).toList(),
        ),
        const SizedBox(height: 24),
        Text('Catatan Kustom', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 8),
        TextField(
          controller: noteController,
          minLines: 3,
          maxLines: 5,
          textCapitalization: TextCapitalization.sentences,
          decoration: const InputDecoration(
            hintText: 'Warna pita, tulisan ucapan, atau permintaan khusus...',
            alignLabelWithHint: true,
          ),
        ),
        if (requiresBookingDate) ...[
          const SizedBox(height: 24),
          Text(
            'Tanggal Booking',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: onBookingPressed,
              icon: const Icon(LucideIcons.calendarDays, size: 19),
              label: Text(
                bookingDate == null
                    ? 'Pilih tanggal booking'
                    : _formatDate(bookingDate!),
              ),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.deepRose,
                minimumSize: const Size.fromHeight(52),
                side: const BorderSide(
                  color: AppColors.primaryPink,
                  width: 1.5,
                ),
                shape: const StadiumBorder(),
              ),
            ),
          ),
          if (bookingDate == null) ...[
            const SizedBox(height: 10),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.preOrderBackground,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(
                    LucideIcons.triangleAlert,
                    size: 18,
                    color: AppColors.warning,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Pilih tanggal booking sebelum menambahkan papan sewa.',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.preOrderText,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
        const SizedBox(height: 24),
        Text('Deskripsi', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 8),
        Text(
          'Dirangkai secara personal dengan material pilihan dan sentuhan '
          'warna yang lembut. Tim florist akan menyesuaikan detail akhir '
          'dengan stok bunga terbaik pada hari pengerjaan.',
          style: Theme.of(context).textTheme.bodyMedium,
        ),
      ],
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

class _PillLabel extends StatelessWidget {
  const _PillLabel({
    required this.text,
    required this.backgroundColor,
    required this.foregroundColor,
  });

  final String text;
  final Color backgroundColor;
  final Color foregroundColor;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        child: Text(
          text,
          style: Theme.of(
            context,
          ).textTheme.labelSmall?.copyWith(color: foregroundColor),
        ),
      ),
    );
  }
}

class _QuantityStepper extends StatelessWidget {
  const _QuantityStepper({
    required this.quantity,
    required this.onDecrease,
    required this.onIncrease,
  });

  final int quantity;
  final VoidCallback? onDecrease;
  final VoidCallback onIncrease;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 52,
      decoration: BoxDecoration(
        color: AppColors.offWhite,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: AppColors.softPink),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          IconButton(
            tooltip: 'Kurangi jumlah',
            onPressed: onDecrease,
            icon: const Icon(LucideIcons.minus, size: 17),
          ),
          SizedBox(
            width: 24,
            child: Text(
              '$quantity',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.labelLarge,
            ),
          ),
          IconButton(
            tooltip: 'Tambah jumlah',
            onPressed: onIncrease,
            icon: const Icon(LucideIcons.plus, size: 17),
          ),
        ],
      ),
    );
  }
}
