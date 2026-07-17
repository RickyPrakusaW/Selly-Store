import 'dart:async';
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:florist_frontend/core/cart_state.dart';
import 'package:florist_frontend/core/currency_formatter.dart';
import 'package:florist_frontend/core/order_state.dart';
import 'package:florist_frontend/core/theme.dart';
import 'package:lucide_flutter/lucide_flutter.dart';

enum _DeliveryMethod { delivery, pickup }

class CheckoutPage extends StatefulWidget {
  const CheckoutPage({super.key});

  @override
  State<CheckoutPage> createState() => _CheckoutPageState();
}

class _CheckoutPageState extends State<CheckoutPage> {
  final _formKey = GlobalKey<FormState>();
  final _addressController = TextEditingController();
  final _recipientController = TextEditingController();
  final _phoneController = TextEditingController();

  Timer? _countdownTimer;
  Duration _remaining = const Duration(hours: 2);
  _DeliveryMethod _deliveryMethod = _DeliveryMethod.delivery;
  var _step = 0;
  var _proofUploaded = false;
  var _orderCreated = false;
  late final String _invoiceNumber;
  OrderModel? _submittedOrder;

  @override
  void initState() {
    super.initState();
    _invoiceNumber = '#SEL-${1000 + Random().nextInt(9000)}';
    cartNotifier.setDelivery(true);
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) {
        return;
      }
      setState(() {
        if (_remaining > Duration.zero) {
          _remaining -= const Duration(seconds: 1);
        }
      });
    });
  }

  @override
  void dispose() {
    _countdownTimer?.cancel();
    _addressController.dispose();
    _recipientController.dispose();
    _phoneController.dispose();
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
        title: const Text('Checkout'),
      ),
      body: ValueListenableBuilder<List<CartItem>>(
        valueListenable: cartNotifier,
        builder: (context, items, _) {
          if (items.isEmpty && _step < 2) {
            return _EmptyCheckout(
              onBackHome: () => Navigator.pushNamedAndRemoveUntil(
                context,
                '/home',
                (route) => false,
              ),
            );
          }

          return SafeArea(
            bottom: false,
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 760),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      _StepIndicator(currentStep: _step),
                      const SizedBox(height: 24),
                      switch (_step) {
                        0 => _buildShippingStep(context),
                        1 => _buildPaymentStep(context),
                        _ => _buildSuccessStep(context),
                      },
                    ],
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildShippingStep(BuildContext context) {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Detail Pengiriman',
            style: Theme.of(context).textTheme.displaySmall,
          ),
          const SizedBox(height: 8),
          Text(
            'Pilih cara menerima pesanan dan isi kontak yang bisa dihubungi.',
            style: Theme.of(
              context,
            ).textTheme.bodyMedium?.copyWith(color: AppColors.mediumGray),
          ),
          const SizedBox(height: 24),
          RadioGroup<_DeliveryMethod>(
            groupValue: _deliveryMethod,
            onChanged: (method) {
              if (method == null) {
                return;
              }
              setState(() {
                _deliveryMethod = method;
                cartNotifier.setDelivery(method == _DeliveryMethod.delivery);
              });
            },
            child: Column(
              children: [
                _DeliveryOption(
                  value: _DeliveryMethod.delivery,
                  selected: _deliveryMethod == _DeliveryMethod.delivery,
                  icon: LucideIcons.truck,
                  title: 'Kirim ke Alamat',
                  subtitle: 'Ongkir tetap Rp 15.000',
                ),
                const SizedBox(height: 10),
                _DeliveryOption(
                  value: _DeliveryMethod.pickup,
                  selected: _deliveryMethod == _DeliveryMethod.pickup,
                  icon: LucideIcons.store,
                  title: 'Ambil di Toko',
                  subtitle: 'Gratis ongkir, ambil di Seli Florist',
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          if (_deliveryMethod == _DeliveryMethod.delivery) ...[
            TextFormField(
              controller: _addressController,
              minLines: 3,
              maxLines: 4,
              textCapitalization: TextCapitalization.sentences,
              validator: (value) => _required(value, 'Alamat lengkap'),
              decoration: const InputDecoration(
                labelText: 'Alamat Lengkap',
                hintText: 'Nama jalan, nomor rumah, kecamatan, kota',
                alignLabelWithHint: true,
                prefixIcon: Icon(LucideIcons.mapPin),
              ),
            ),
            const SizedBox(height: 14),
          ],
          TextFormField(
            controller: _recipientController,
            textCapitalization: TextCapitalization.words,
            validator: (value) => _required(value, 'Nama penerima'),
            decoration: const InputDecoration(
              labelText: 'Nama Penerima',
              hintText: 'Nama lengkap penerima',
              prefixIcon: Icon(LucideIcons.userRound),
            ),
          ),
          const SizedBox(height: 14),
          TextFormField(
            controller: _phoneController,
            keyboardType: TextInputType.phone,
            validator: (value) => _required(value, 'Nomor telepon/WA'),
            decoration: const InputDecoration(
              labelText: 'Nomor Telepon / WA Penerima',
              hintText: '08xxxxxxxxxx',
              prefixIcon: Icon(LucideIcons.phone),
            ),
          ),
          const SizedBox(height: 24),
          _OrderTotalPreview(),
          const SizedBox(height: 24),
          FilledButton.icon(
            onPressed: _goToPayment,
            iconAlignment: IconAlignment.end,
            icon: const Icon(LucideIcons.arrowRight, size: 19),
            label: const Text('Lanjut ke Pembayaran'),
            style: FilledButton.styleFrom(
              minimumSize: const Size.fromHeight(52),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentStep(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text('Pembayaran DP', style: Theme.of(context).textTheme.displaySmall),
        const SizedBox(height: 8),
        Text(
          'Transfer DP 50% untuk mengunci pesananmu.',
          style: Theme.of(
            context,
          ).textTheme.bodyMedium?.copyWith(color: AppColors.mediumGray),
        ),
        const SizedBox(height: 20),
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: AppColors.blushRose,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.softPink),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Total DP 50%',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 4),
              Text(
                formatRupiah(cartNotifier.downPayment),
                style: Theme.of(context).textTheme.displaySmall?.copyWith(
                  color: AppColors.deepRose,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  const Icon(
                    LucideIcons.clock,
                    size: 18,
                    color: AppColors.warning,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Selesaikan dalam ${_formatDuration(_remaining)}',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: _remaining < const Duration(minutes: 30)
                            ? AppColors.error
                            : AppColors.preOrderText,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: AppColors.pureWhite,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.lightGray),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Transfer ke rekening',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: AppColors.deepRose,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    alignment: Alignment.center,
                    child: const Text(
                      'BCA',
                      style: TextStyle(
                        color: AppColors.pureWhite,
                        fontWeight: FontWeight.w700,
                        fontSize: 11,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      '1234567890\n a/n Seli',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                  ),
                  IconButton(
                    tooltip: 'Salin nomor rekening',
                    onPressed: _copyAccountNumber,
                    icon: const Icon(LucideIcons.copy),
                    color: AppColors.deepRose,
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        OutlinedButton.icon(
          onPressed: () => setState(() => _proofUploaded = !_proofUploaded),
          icon: Icon(
            _proofUploaded ? LucideIcons.refreshCw : LucideIcons.upload,
            size: 19,
          ),
          label: Text(
            _proofUploaded ? 'Ganti Bukti Transfer' : 'Upload Bukti Transfer',
          ),
          style: OutlinedButton.styleFrom(
            minimumSize: const Size.fromHeight(52),
            foregroundColor: AppColors.deepRose,
            side: const BorderSide(color: AppColors.primaryPink, width: 1.5),
            shape: const StadiumBorder(),
          ),
        ),
        if (_proofUploaded) ...[
          const SizedBox(height: 12),
          Container(
            height: 170,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [AppColors.offWhite, AppColors.blushRose],
              ),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.softPink),
            ),
            child: Stack(
              alignment: Alignment.center,
              children: [
                const Icon(
                  LucideIcons.image,
                  size: 54,
                  color: AppColors.primaryPink,
                ),
                Positioned(
                  bottom: 14,
                  child: Text(
                    'preview-bukti-transfer.jpg',
                    style: Theme.of(
                      context,
                    ).textTheme.bodySmall?.copyWith(color: AppColors.deepRose),
                  ),
                ),
              ],
            ),
          ),
        ],
        const SizedBox(height: 24),
        Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: () => setState(() => _step = 0),
                child: const Text('Kembali'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              flex: 2,
              child: FilledButton.icon(
                onPressed: _proofUploaded ? _completePayment : null,
                icon: const Icon(LucideIcons.circleCheck, size: 19),
                label: const Text('Konfirmasi Pembayaran'),
                style: FilledButton.styleFrom(
                  minimumSize: const Size.fromHeight(52),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildSuccessStep(BuildContext context) {
    final submittedOrder = _submittedOrder;
    return Center(
      child: Column(
        children: [
          Container(
            width: 112,
            height: 112,
            decoration: const BoxDecoration(
              color: AppColors.readyStockBackground,
              shape: BoxShape.circle,
            ),
            child: const Icon(
              LucideIcons.flower2,
              size: 56,
              color: AppColors.success,
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'Pesanan berhasil dibuat',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.displaySmall,
          ),
          const SizedBox(height: 8),
          Text(
            submittedOrder?.orderId ?? _invoiceNumber,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
              color: AppColors.deepRose,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'Bukti pembayaranmu sudah diterima. Admin sedang memverifikasi '
            'pembayaran dan akan menghubungimu melalui WhatsApp.',
            textAlign: TextAlign.center,
            style: Theme.of(
              context,
            ).textTheme.bodyMedium?.copyWith(color: AppColors.mediumGray),
          ),
          const SizedBox(height: 28),
          FilledButton.icon(
            onPressed: () {
              Navigator.pushNamedAndRemoveUntil(
                context,
                '/home',
                (route) => false,
              );
            },
            icon: const Icon(LucideIcons.house, size: 19),
            label: const Text('Kembali ke Beranda'),
            style: FilledButton.styleFrom(
              minimumSize: const Size.fromHeight(52),
            ),
          ),
        ],
      ),
    );
  }

  void _goToPayment() {
    if (!(_formKey.currentState?.validate() ?? false)) {
      return;
    }
    setState(() => _step = 1);
  }

  void _completePayment() {
    if (_orderCreated || cartNotifier.value.isEmpty) {
      setState(() => _step = 2);
      return;
    }

    final order = OrderModel(
      orderId: _invoiceNumber,
      items: List.unmodifiable(cartNotifier.value),
      total: cartNotifier.total,
      status: OrderStatuses.waitingVerification,
      createdAt: DateTime.now(),
      recipientName: _recipientController.text.trim(),
      phone: _phoneController.text.trim(),
      address: _deliveryMethod == _DeliveryMethod.delivery
          ? _addressController.text.trim()
          : 'Ambil di toko Seli Florist',
      deliveryType: _deliveryMethod == _DeliveryMethod.delivery
          ? 'Kirim ke Alamat'
          : 'Ambil di Toko',
    );

    orderNotifier.createOrder(order);
    cartNotifier.clearCart();
    _submittedOrder = order;
    _orderCreated = true;
    setState(() => _step = 2);
  }

  void _copyAccountNumber() {
    Clipboard.setData(const ClipboardData(text: '1234567890'));
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        const SnackBar(
          content: Text('Nomor rekening berhasil disalin'),
          behavior: SnackBarBehavior.floating,
        ),
      );
  }

  String? _required(String? value, String label) {
    if (value == null || value.trim().isEmpty) {
      return '$label wajib diisi';
    }
    return null;
  }

  String _formatDuration(Duration duration) {
    final hours = duration.inHours.toString().padLeft(2, '0');
    final minutes = (duration.inMinutes % 60).toString().padLeft(2, '0');
    final seconds = (duration.inSeconds % 60).toString().padLeft(2, '0');
    return '$hours:$minutes:$seconds';
  }
}

class _StepIndicator extends StatelessWidget {
  const _StepIndicator({required this.currentStep});

  final int currentStep;

  @override
  Widget build(BuildContext context) {
    const labels = ['Pengiriman', 'Pembayaran DP', 'Selesai'];
    const icons = [
      LucideIcons.truck,
      LucideIcons.creditCard,
      LucideIcons.circleCheck,
    ];

    return Row(
      children: List.generate(labels.length * 2 - 1, (index) {
        if (index.isOdd) {
          return Expanded(
            child: Container(
              height: 2,
              color: currentStep >= index ~/ 2 + 1
                  ? AppColors.primaryPink
                  : AppColors.lightGray,
            ),
          );
        }

        final step = index ~/ 2;
        final isActive = step <= currentStep;
        return SizedBox(
          width: 88,
          child: Column(
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: isActive ? AppColors.primaryPink : AppColors.blushRose,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  icons[step],
                  size: 18,
                  color: isActive ? AppColors.pureWhite : AppColors.mediumGray,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                labels[step],
                maxLines: 2,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: isActive ? AppColors.deepRose : AppColors.mediumGray,
                  fontWeight: isActive ? FontWeight.w700 : FontWeight.w500,
                ),
              ),
            ],
          ),
        );
      }),
    );
  }
}

class _DeliveryOption extends StatelessWidget {
  const _DeliveryOption({
    required this.value,
    required this.selected,
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  final _DeliveryMethod value;
  final bool selected;
  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () =>
          RadioGroup.maybeOf<_DeliveryMethod>(context)?.onChanged(value),
      borderRadius: BorderRadius.circular(16),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: selected ? AppColors.blushRose : AppColors.pureWhite,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: selected ? AppColors.primaryPink : AppColors.lightGray,
            width: selected ? 1.5 : 1,
          ),
        ),
        child: Row(
          children: [
            Icon(icon, color: AppColors.deepRose, size: 23),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: Theme.of(context).textTheme.titleSmall),
                  Text(subtitle, style: Theme.of(context).textTheme.bodySmall),
                ],
              ),
            ),
            Radio<_DeliveryMethod>(value: value),
          ],
        ),
      ),
    );
  }
}

class _OrderTotalPreview extends StatelessWidget {
  const _OrderTotalPreview();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.offWhite,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        children: [
          _CheckoutRow(
            label: 'Total pesanan',
            value: formatRupiah(cartNotifier.total),
          ),
          const SizedBox(height: 8),
          _CheckoutRow(
            label: 'DP yang dibayar sekarang',
            value: formatRupiah(cartNotifier.downPayment),
            emphasized: true,
          ),
        ],
      ),
    );
  }
}

class _CheckoutRow extends StatelessWidget {
  const _CheckoutRow({
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
        ? Theme.of(context).textTheme.titleSmall?.copyWith(
            color: AppColors.deepRose,
            fontWeight: FontWeight.w700,
          )
        : Theme.of(context).textTheme.bodyMedium;
    return Row(
      children: [
        Expanded(child: Text(label, style: style)),
        const SizedBox(width: 12),
        Text(value, style: style),
      ],
    );
  }
}

class _EmptyCheckout extends StatelessWidget {
  const _EmptyCheckout({required this.onBackHome});

  final VoidCallback onBackHome;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              LucideIcons.shoppingBag,
              size: 64,
              color: AppColors.primaryPink,
            ),
            const SizedBox(height: 16),
            Text(
              'Belum ada produk untuk dibayar',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.displaySmall,
            ),
            const SizedBox(height: 20),
            FilledButton(
              onPressed: onBackHome,
              child: const Text('Kembali ke Beranda'),
            ),
          ],
        ),
      ),
    );
  }
}
