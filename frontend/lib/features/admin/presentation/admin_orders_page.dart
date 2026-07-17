import 'package:flutter/material.dart';
import 'package:florist_frontend/core/cart_state.dart';
import 'package:florist_frontend/core/order_state.dart';
import 'package:florist_frontend/core/theme.dart';
import 'package:florist_frontend/features/home/domain/product_preview.dart';
import 'package:florist_frontend/features/home/presentation/widgets/product_artwork.dart';
import 'package:lucide_flutter/lucide_flutter.dart';

const _ordersBackground = Color(0xFFF8F9FC);
const _ordersBorder = Color(0xFFECEEF2);
const _transferProofAsset = 'assets/images/demo-transfer-proof.png';

class AdminOrdersPage extends StatefulWidget {
  const AdminOrdersPage({
    required this.showMenuButton,
    this.initialOrderId,
    super.key,
  });

  final bool showMenuButton;
  final String? initialOrderId;

  @override
  State<AdminOrdersPage> createState() => _AdminOrdersPageState();
}

class _AdminOrdersPageState extends State<AdminOrdersPage> {
  static const _tabs = ['Semua', 'Menunggu DP', 'Diproses', 'Selesai'];
  static final _initialOrders = [
    _AdminOrderData(
      id: '#ORD-0982',
      customer: 'Sarah Wijaya',
      email: 'sarah.wijaya@email.com',
      phone: '0812 3456 7890',
      address: 'Jl. Melati No. 18, Bandung — Kurir Seli Florist',
      product: ProductPreview(
        name: 'Premium Rose Bouquet + Choco',
        category: 'Bunga Bouquet',
        price: 450000,
        stockStatus: ProductStockStatus.readyStock,
        visual: ProductVisual.bouquet,
      ),
      variant: 'Premium — Mawar Pink',
      customNote: 'Happy anniversary, love. Gunakan pita dusty pink.',
      bookingDate: '26 Oct 2023',
      quantity: 1,
      date: '24 Oct 2023',
      createdAt: DateTime(2023, 10, 24, 10, 30),
      status: 'Menunggu DP',
      subtotal: 'Rp 450.000',
      shipping: 'Rp 25.000',
      voucherCode: 'SELIPINK',
      discount: '-Rp 25.000',
      total: 'Rp 450.000',
      downPayment: 'Rp 225.000',
      remaining: 'Rp 225.000',
    ),
    _AdminOrderData(
      id: '#ORD-0981',
      customer: 'Budi Santoso',
      email: 'budi.santoso@email.com',
      phone: '0813 7788 9900',
      address: 'Pickup di Toko Seli Florist, pukul 15:00 WIB',
      product: ProductPreview(
        name: 'Papan Bunga Duka Cita Large',
        category: 'Papan Ucapan',
        price: 1200000,
        stockStatus: ProductStockStatus.preOrder,
        visual: ProductVisual.board,
      ),
      variant: 'Large 2 x 1.5 meter',
      customNote: 'Turut berduka cita — Keluarga Besar Santoso.',
      bookingDate: '25 Oct 2023',
      quantity: 1,
      date: '24 Oct 2023',
      createdAt: DateTime(2023, 10, 24, 11, 15),
      status: 'Menunggu DP',
      subtotal: 'Rp 1.200.000',
      shipping: 'Rp 0',
      voucherCode: '-',
      discount: 'Rp 0',
      total: 'Rp 1.200.000',
      downPayment: 'Rp 600.000',
      remaining: 'Rp 600.000',
    ),
  ];

  var _selectedTab = 0;
  DateTimeRange? _dateRange;
  late List<_AdminOrderData> _orders;

  @override
  void initState() {
    super.initState();
    _orders = _initialOrders.map((order) {
      final global = orderNotifier.value
          .where((item) => item.orderId == order.id)
          .firstOrNull;
      return global == null
          ? order
          : order.copyWith(status: _displayStatus(global.status));
    }).toList();
    for (final order in _orders) {
      if (!orderNotifier.value.any((item) => item.orderId == order.id)) {
        orderNotifier.createOrder(_toGlobalOrder(order));
      }
    }
    final initialOrderId = widget.initialOrderId;
    if (initialOrderId != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        final order = _orders
            .where((item) => item.id == initialOrderId)
            .firstOrNull;
        if (order != null) _showOrderDetail(order);
      });
    }
  }

  List<_AdminOrderData> get _visibleOrders {
    Iterable<_AdminOrderData> result = _orders;
    if (_selectedTab != 0) {
      final status = _tabs[_selectedTab];
      result = result.where((order) => order.status == status);
    }
    final range = _dateRange;
    if (range != null) {
      final end = DateTime(
        range.end.year,
        range.end.month,
        range.end.day,
        23,
        59,
        59,
      );
      result = result.where(
        (order) =>
            !order.createdAt.isBefore(range.start) &&
            !order.createdAt.isAfter(end),
      );
    }
    return result.toList();
  }

  @override
  Widget build(BuildContext context) {
    final isMobile = MediaQuery.sizeOf(context).width < 600;

    return ColoredBox(
      color: _ordersBackground,
      child: SafeArea(
        child: Column(
          children: [
            _OrdersHeader(
              isMobile: isMobile,
              showMenuButton: widget.showMenuButton,
              dateLabel: _dateRangeLabel,
              onDatePressed: _selectDateRange,
            ),
            _OrderTabs(
              tabs: _tabs,
              selectedIndex: _selectedTab,
              onSelected: (index) => setState(() => _selectedTab = index),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: EdgeInsets.fromLTRB(
                  isMobile ? 12 : 28,
                  isMobile ? 14 : 24,
                  isMobile ? 12 : 28,
                  36,
                ),
                child: Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 1320),
                    child: _visibleOrders.isEmpty
                        ? const _EmptyOrders()
                        : isMobile
                        ? _MobileOrderList(
                            orders: _visibleOrders,
                            onOpen: _showOrderDetail,
                            onVerify: _verifyOrder,
                          )
                        : _OrdersTable(
                            orders: _visibleOrders,
                            onOpen: _showOrderDetail,
                            onVerify: _verifyOrder,
                          ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String get _dateRangeLabel {
    final range = _dateRange;
    if (range == null) {
      return 'Pilih Rentang Tanggal';
    }
    return '${_formatDate(range.start)} — ${_formatDate(range.end)}';
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

  Future<void> _selectDateRange() async {
    final now = DateTime.now();
    final selected = await showDateRangePicker(
      context: context,
      firstDate: DateTime(2020),
      lastDate: DateTime(now.year + 2),
      initialDateRange: _dateRange,
      helpText: 'Filter Tanggal Pesanan',
      saveText: 'Terapkan',
    );
    if (selected != null && mounted) {
      setState(() => _dateRange = selected);
    }
  }

  void _showOrderDetail(_AdminOrderData order) {
    showDialog<void>(
      context: context,
      builder: (_) => _FullTransactionDialog(
        order: order,
        onApprove: () => _changeStatus(order, OrderStatuses.processing),
        onReject: () => _changeStatus(order, OrderStatuses.rejected),
      ),
    );
  }

  void _verifyOrder(_AdminOrderData order) {
    _showOrderDetail(order);
  }

  void _changeStatus(_AdminOrderData order, String status) {
    orderNotifier.updateOrderStatus(order.id, status);
    setState(() {
      final index = _orders.indexWhere((item) => item.id == order.id);
      if (index >= 0) {
        _orders[index] = _orders[index].copyWith(
          status: _displayStatus(status),
        );
      }
    });
    Navigator.of(context, rootNavigator: true).pop();
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          content: Text(
            status == OrderStatuses.processing
                ? 'Pembayaran disetujui. Pesanan diproses.'
                : 'Pembayaran ditolak.',
          ),
          behavior: SnackBarBehavior.floating,
        ),
      );
  }

  String _displayStatus(String status) {
    return status == OrderStatuses.waitingVerification ? 'Menunggu DP' : status;
  }

  OrderModel _toGlobalOrder(_AdminOrderData order) {
    return OrderModel(
      orderId: order.id,
      items: [
        CartItem(
          product: order.product,
          variant: order.variant,
          customNote: order.customNote,
          bookingDate: order.bookingDate == null
              ? null
              : DateTime(2023, 10, order.id == '#ORD-0982' ? 26 : 25),
          quantity: order.quantity,
        ),
      ],
      total: order.product.price * order.quantity,
      status: OrderStatuses.waitingVerification,
      createdAt: order.createdAt,
      recipientName: order.customer,
      phone: order.phone,
      address: order.address,
      deliveryType: order.address.contains('Pickup') ? 'Pickup' : 'Delivery',
    );
  }
}

class _OrdersHeader extends StatelessWidget {
  const _OrdersHeader({
    required this.isMobile,
    required this.showMenuButton,
    required this.dateLabel,
    required this.onDatePressed,
  });

  final bool isMobile;
  final bool showMenuButton;
  final String dateLabel;
  final VoidCallback onDatePressed;

  @override
  Widget build(BuildContext context) {
    final title = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Order Management',
          style: Theme.of(context).textTheme.headlineLarge?.copyWith(
            color: AppColors.charcoal,
            fontFamily: 'PlusJakartaSans',
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 5),
        Text(
          'View and process customer orders',
          style: Theme.of(
            context,
          ).textTheme.bodyMedium?.copyWith(color: AppColors.mediumGray),
        ),
      ],
    );
    final dateButton = OutlinedButton.icon(
      key: const ValueKey('admin-order-date-range'),
      onPressed: onDatePressed,
      icon: const Icon(LucideIcons.calendarRange, size: 18),
      label: Text(dateLabel, maxLines: 1, overflow: TextOverflow.ellipsis),
      style: OutlinedButton.styleFrom(
        foregroundColor: AppColors.darkGray,
        side: const BorderSide(color: _ordersBorder),
        minimumSize: const Size(0, 48),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );

    return Container(
      color: AppColors.pureWhite,
      padding: EdgeInsets.fromLTRB(
        isMobile ? 12 : 28,
        isMobile ? 16 : 22,
        isMobile ? 12 : 28,
        isMobile ? 16 : 22,
      ),
      child: isMobile
          ? Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    if (showMenuButton) ...[
                      Builder(
                        builder: (context) => IconButton(
                          tooltip: 'Buka navigasi admin',
                          onPressed: () => Scaffold.of(context).openDrawer(),
                          icon: const Icon(LucideIcons.menu),
                        ),
                      ),
                      const SizedBox(width: 6),
                    ],
                    Expanded(child: title),
                  ],
                ),
                const SizedBox(height: 14),
                const _OrderSearchField(),
                const SizedBox(height: 10),
                dateButton,
              ],
            )
          : Row(
              children: [
                if (showMenuButton) ...[
                  Builder(
                    builder: (context) => IconButton(
                      tooltip: 'Buka navigasi admin',
                      onPressed: () => Scaffold.of(context).openDrawer(),
                      icon: const Icon(LucideIcons.menu),
                    ),
                  ),
                  const SizedBox(width: 10),
                ],
                Expanded(child: title),
                SizedBox(width: 300, child: dateButton),
                const SizedBox(width: 12),
                const SizedBox(width: 340, child: _OrderSearchField()),
              ],
            ),
    );
  }
}

class _OrderSearchField extends StatelessWidget {
  const _OrderSearchField();

  @override
  Widget build(BuildContext context) {
    return TextField(
      decoration: InputDecoration(
        hintText: 'Search Order ID, Customer, or Phone...',
        prefixIcon: const Icon(LucideIcons.search, size: 19),
        filled: true,
        fillColor: _ordersBackground,
        contentPadding: const EdgeInsets.symmetric(vertical: 13),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: _ordersBorder),
        ),
      ),
    );
  }
}

class _OrderTabs extends StatelessWidget {
  const _OrderTabs({
    required this.tabs,
    required this.selectedIndex,
    required this.onSelected,
  });

  final List<String> tabs;
  final int selectedIndex;
  final ValueChanged<int> onSelected;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      color: AppColors.pureWhite,
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: Row(
          children: tabs.indexed.map((entry) {
            final selected = entry.$1 == selectedIndex;
            return InkWell(
              onTap: () => onSelected(entry.$1),
              child: Container(
                padding: const EdgeInsets.fromLTRB(14, 15, 14, 12),
                decoration: BoxDecoration(
                  border: Border(
                    bottom: BorderSide(
                      color: selected
                          ? AppColors.primaryPink
                          : Colors.transparent,
                      width: 3,
                    ),
                  ),
                ),
                child: Text(
                  entry.$2,
                  style: Theme.of(context).textTheme.labelLarge?.copyWith(
                    color: selected ? AppColors.deepRose : AppColors.mediumGray,
                    fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }
}

class _OrdersTable extends StatelessWidget {
  const _OrdersTable({
    required this.orders,
    required this.onOpen,
    required this.onVerify,
  });

  final List<_AdminOrderData> orders;
  final ValueChanged<_AdminOrderData> onOpen;
  final ValueChanged<_AdminOrderData> onVerify;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.pureWhite,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: _ordersBorder),
      ),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: DataTable(
          showCheckboxColumn: false,
          headingRowHeight: 54,
          dataRowMinHeight: 78,
          dataRowMaxHeight: 78,
          horizontalMargin: 22,
          columnSpacing: 44,
          columns: const [
            DataColumn(label: Text('ORDER ID')),
            DataColumn(label: Text('CUSTOMER')),
            DataColumn(label: Text('DATE')),
            DataColumn(label: Text('TOTAL')),
            DataColumn(label: Text('STATUS')),
            DataColumn(label: Text('ACTION')),
          ],
          rows: orders
              .map(
                (order) => DataRow(
                  onSelectChanged: (_) => onOpen(order),
                  cells: [
                    DataCell(
                      Text(
                        order.id,
                        style: Theme.of(context).textTheme.labelLarge?.copyWith(
                          color: AppColors.deepRose,
                        ),
                      ),
                    ),
                    DataCell(
                      SizedBox(
                        width: 245,
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(order.customer),
                            const SizedBox(height: 4),
                            Text(
                              order.product.name,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                          ],
                        ),
                      ),
                    ),
                    DataCell(Text(order.date)),
                    DataCell(Text(order.total)),
                    DataCell(_OrderStatusBadge(status: order.status)),
                    DataCell(_VerifyButton(onPressed: () => onVerify(order))),
                  ],
                ),
              )
              .toList(),
        ),
      ),
    );
  }
}

class _MobileOrderList extends StatelessWidget {
  const _MobileOrderList({
    required this.orders,
    required this.onOpen,
    required this.onVerify,
  });

  final List<_AdminOrderData> orders;
  final ValueChanged<_AdminOrderData> onOpen;
  final ValueChanged<_AdminOrderData> onVerify;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: orders
          .map(
            (order) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Material(
                color: AppColors.pureWhite,
                borderRadius: BorderRadius.circular(16),
                child: InkWell(
                  onTap: () => onOpen(order),
                  borderRadius: BorderRadius.circular(16),
                  child: Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: _ordersBorder),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                order.id,
                                style: Theme.of(context).textTheme.titleSmall
                                    ?.copyWith(color: AppColors.deepRose),
                              ),
                            ),
                            _OrderStatusBadge(status: order.status),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Text(
                          order.customer,
                          style: Theme.of(context).textTheme.labelLarge,
                        ),
                        const SizedBox(height: 3),
                        Text(
                          order.product.name,
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            const Icon(
                              LucideIcons.calendarDays,
                              size: 15,
                              color: AppColors.mediumGray,
                            ),
                            const SizedBox(width: 6),
                            Text(
                              order.date,
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                            const Spacer(),
                            Text(
                              order.total,
                              style: Theme.of(context).textTheme.titleSmall,
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),
                        _VerifyButton(
                          expand: true,
                          onPressed: () => onVerify(order),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          )
          .toList(),
    );
  }
}

class _OrderStatusBadge extends StatelessWidget {
  const _OrderStatusBadge({required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    final (background, foreground) = switch (status) {
      'Diproses' => (const Color(0xFFE8F0FF), const Color(0xFF2563EB)),
      'Selesai' => (AppColors.readyStockBackground, AppColors.readyStockText),
      _ => (const Color(0xFFFFE7D6), const Color(0xFFB45309)),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 6),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        status.toUpperCase(),
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
          color: foreground,
          fontSize: 9,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class _VerifyButton extends StatelessWidget {
  const _VerifyButton({required this.onPressed, this.expand = false});

  final VoidCallback onPressed;
  final bool expand;

  @override
  Widget build(BuildContext context) {
    final button = FilledButton.icon(
      onPressed: onPressed,
      icon: const Icon(LucideIcons.badgeCheck, size: 17),
      label: const Text('Verify'),
      style: FilledButton.styleFrom(
        backgroundColor: AppColors.primaryPink,
        minimumSize: Size(expand ? double.infinity : 94, 44),
      ),
    );
    return expand ? SizedBox(width: double.infinity, child: button) : button;
  }
}

class _EmptyOrders extends StatelessWidget {
  const _EmptyOrders();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(40),
      decoration: BoxDecoration(
        color: AppColors.pureWhite,
        borderRadius: BorderRadius.circular(18),
      ),
      child: const Column(
        children: [
          Icon(LucideIcons.inbox, size: 42, color: AppColors.primaryPink),
          SizedBox(height: 12),
          Text('Tidak ada pesanan pada filter ini'),
        ],
      ),
    );
  }
}

class _FullTransactionDialog extends StatelessWidget {
  const _FullTransactionDialog({
    required this.order,
    required this.onApprove,
    required this.onReject,
  });

  final _AdminOrderData order;
  final VoidCallback onApprove;
  final VoidCallback onReject;

  @override
  Widget build(BuildContext context) {
    return Dialog(
      insetPadding: const EdgeInsets.all(12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
      child: ConstrainedBox(
        constraints: BoxConstraints(
          maxWidth: 880,
          maxHeight: MediaQuery.sizeOf(context).height * 0.9,
        ),
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(22, 18, 14, 14),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Detail Transaksi Lengkap',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        const SizedBox(height: 3),
                        Text(
                          order.id,
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    tooltip: 'Tutup',
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(LucideIcons.x),
                  ),
                ],
              ),
            ),
            const Divider(height: 1, color: _ordersBorder),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    _DetailSection(
                      title: 'Info Pemesan',
                      icon: LucideIcons.userRound,
                      child: Wrap(
                        spacing: 20,
                        runSpacing: 14,
                        children: [
                          _InfoField(
                            label: 'Nama Customer',
                            value: order.customer,
                          ),
                          _InfoField(label: 'Email', value: order.email),
                          _InfoField(
                            label: 'Nomor WhatsApp',
                            value: order.phone,
                          ),
                          _InfoField(
                            label: 'Pengiriman / Pickup',
                            value: order.address,
                            wide: true,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    _DetailSection(
                      title: 'Daftar Barang',
                      icon: LucideIcons.shoppingBag,
                      child: _TransactionItem(order: order),
                    ),
                    const SizedBox(height: 16),
                    _DetailSection(
                      title: 'Rincian Pembayaran',
                      icon: LucideIcons.receiptText,
                      child: Column(
                        children: [
                          _PaymentRow(label: 'Subtotal', value: order.subtotal),
                          _PaymentRow(
                            label: 'Biaya Ongkir',
                            value: order.shipping,
                          ),
                          _PaymentRow(
                            label: 'Voucher (${order.voucherCode})',
                            value: order.discount,
                            valueColor: AppColors.success,
                          ),
                          const Divider(height: 22, color: _ordersBorder),
                          _PaymentRow(
                            label: 'Total Keseluruhan',
                            value: order.total,
                            emphasized: true,
                          ),
                          _PaymentRow(
                            label: 'DP 50% — Sudah Dibayar',
                            value: order.downPayment,
                            valueColor: AppColors.success,
                          ),
                          _PaymentRow(
                            label: 'Sisa Pelunasan',
                            value: order.remaining,
                            emphasized: true,
                            valueColor: AppColors.deepRose,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    _DetailSection(
                      title: 'Bukti Transfer',
                      icon: LucideIcons.image,
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(14),
                        child: Container(
                          color: _ordersBackground,
                          constraints: const BoxConstraints(maxHeight: 520),
                          child: Image.asset(
                            _transferProofAsset,
                            width: double.infinity,
                            fit: BoxFit.contain,
                          ),
                        ),
                      ),
                    ),
                    if (order.status == 'Menunggu DP') ...[
                      const SizedBox(height: 18),
                      LayoutBuilder(
                        builder: (context, constraints) {
                          final compact = constraints.maxWidth < 520;
                          final approve = FilledButton.icon(
                            key: const ValueKey('approve-admin-payment'),
                            onPressed: onApprove,
                            icon: const Icon(LucideIcons.check, size: 18),
                            label: const Text('Setujui Pembayaran'),
                            style: FilledButton.styleFrom(
                              backgroundColor: AppColors.success,
                            ),
                          );
                          final reject = OutlinedButton.icon(
                            key: const ValueKey('reject-admin-payment'),
                            onPressed: onReject,
                            icon: const Icon(LucideIcons.x, size: 18),
                            label: const Text('Tolak Pembayaran'),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: AppColors.error,
                              side: const BorderSide(color: AppColors.error),
                            ),
                          );
                          if (compact) {
                            return Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                approve,
                                const SizedBox(height: 10),
                                reject,
                              ],
                            );
                          }
                          return Row(
                            children: [
                              Expanded(child: approve),
                              const SizedBox(width: 12),
                              Expanded(child: reject),
                            ],
                          );
                        },
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DetailSection extends StatelessWidget {
  const _DetailSection({
    required this.title,
    required this.icon,
    required this.child,
  });

  final String title;
  final IconData icon;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.pureWhite,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: _ordersBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Icon(icon, size: 19, color: AppColors.deepRose),
              const SizedBox(width: 9),
              Text(title, style: Theme.of(context).textTheme.titleMedium),
            ],
          ),
          const SizedBox(height: 16),
          child,
        ],
      ),
    );
  }
}

class _InfoField extends StatelessWidget {
  const _InfoField({
    required this.label,
    required this.value,
    this.wide = false,
  });

  final String label;
  final String value;
  final bool wide;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: wide ? 720 : 330,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 3),
          Text(value, style: Theme.of(context).textTheme.labelLarge),
        ],
      ),
    );
  }
}

class _TransactionItem extends StatelessWidget {
  const _TransactionItem({required this.order});

  final _AdminOrderData order;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final compact = constraints.maxWidth < 520;
        final image = ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: SizedBox.square(
            dimension: compact ? 72 : 86,
            child: ProductArtwork(product: order.product),
          ),
        );
        final details = Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              order.product.name,
              style: Theme.of(context).textTheme.titleSmall,
            ),
            const SizedBox(height: 7),
            Text('Varian: ${order.variant}'),
            Text('Catatan: ${order.customNote}'),
            if (order.bookingDate != null)
              Text('Tanggal booking: ${order.bookingDate}'),
            const SizedBox(height: 5),
            Text(
              'Quantity: ${order.quantity}',
              style: Theme.of(
                context,
              ).textTheme.labelLarge?.copyWith(color: AppColors.deepRose),
            ),
          ],
        );

        if (compact) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [image, const SizedBox(height: 12), details],
          );
        }
        return Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            image,
            const SizedBox(width: 14),
            Expanded(child: details),
          ],
        );
      },
    );
  }
}

class _PaymentRow extends StatelessWidget {
  const _PaymentRow({
    required this.label,
    required this.value,
    this.emphasized = false,
    this.valueColor,
  });

  final String label;
  final String value;
  final bool emphasized;
  final Color? valueColor;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        children: [
          Expanded(
            child: Text(
              label,
              style: emphasized
                  ? Theme.of(context).textTheme.labelLarge
                  : Theme.of(context).textTheme.bodyMedium,
            ),
          ),
          const SizedBox(width: 12),
          Text(
            value,
            style: Theme.of(context).textTheme.labelLarge?.copyWith(
              color: valueColor ?? AppColors.charcoal,
              fontWeight: emphasized ? FontWeight.w700 : FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

class _AdminOrderData {
  const _AdminOrderData({
    required this.id,
    required this.customer,
    required this.email,
    required this.phone,
    required this.address,
    required this.product,
    required this.variant,
    required this.customNote,
    required this.bookingDate,
    required this.quantity,
    required this.date,
    required this.createdAt,
    required this.status,
    required this.subtotal,
    required this.shipping,
    required this.voucherCode,
    required this.discount,
    required this.total,
    required this.downPayment,
    required this.remaining,
  });

  final String id;
  final String customer;
  final String email;
  final String phone;
  final String address;
  final ProductPreview product;
  final String variant;
  final String customNote;
  final String? bookingDate;
  final int quantity;
  final String date;
  final DateTime createdAt;
  final String status;
  final String subtotal;
  final String shipping;
  final String voucherCode;
  final String discount;
  final String total;
  final String downPayment;
  final String remaining;

  _AdminOrderData copyWith({String? status}) {
    return _AdminOrderData(
      id: id,
      customer: customer,
      email: email,
      phone: phone,
      address: address,
      product: product,
      variant: variant,
      customNote: customNote,
      bookingDate: bookingDate,
      quantity: quantity,
      date: date,
      createdAt: createdAt,
      status: status ?? this.status,
      subtotal: subtotal,
      shipping: shipping,
      voucherCode: voucherCode,
      discount: discount,
      total: total,
      downPayment: downPayment,
      remaining: remaining,
    );
  }
}
