import 'package:flutter/material.dart';
import 'package:florist_frontend/core/theme.dart';
import 'package:lucide_flutter/lucide_flutter.dart';

const _pageBackground = Color(0xFFF8F9FC);
const _pageBorder = Color(0xFFECEEF2);

class OrdersManagementPage extends StatefulWidget {
  const OrdersManagementPage({required this.showMenuButton, super.key});

  final bool showMenuButton;

  @override
  State<OrdersManagementPage> createState() => _OrdersManagementPageState();
}

class _OrdersManagementPageState extends State<OrdersManagementPage> {
  static const _tabs = ['Menunggu DP (12)', 'Semua', 'Diproses (5)', 'Selesai'];

  static const _orders = [
    _OrderData(
      id: '#ORD-0982',
      customer: 'Sarah Wijaya',
      product: 'Premium Rose Bouquet + Choco',
      date: '24 Oct 2023',
      total: 'Rp 450.000',
    ),
    _OrderData(
      id: '#ORD-0981',
      customer: 'Budi Santoso',
      product: 'Papan Bunga Duka Cita Large',
      date: '24 Oct 2023',
      total: 'Rp 1.200.000',
    ),
  ];

  var _selectedTab = 0;

  @override
  Widget build(BuildContext context) {
    final isMobile = MediaQuery.sizeOf(context).width < 600;

    return ColoredBox(
      color: _pageBackground,
      child: SafeArea(
        child: Column(
          children: [
            _OrdersHeader(
              isMobile: isMobile,
              showMenuButton: widget.showMenuButton,
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
                    child: isMobile
                        ? _MobileOrderList(
                            orders: _orders,
                            onVerify: _verifyOrder,
                          )
                        : _OrdersTable(orders: _orders, onVerify: _verifyOrder),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _verifyOrder(_OrderData order) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          content: Text('Membuka verifikasi pembayaran ${order.id}'),
          behavior: SnackBarBehavior.floating,
        ),
      );
  }
}

class _OrdersHeader extends StatelessWidget {
  const _OrdersHeader({required this.isMobile, required this.showMenuButton});

  final bool isMobile;
  final bool showMenuButton;

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
                const SizedBox(width: 24),
                const SizedBox(width: 390, child: _OrderSearchField()),
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
        fillColor: _pageBackground,
        contentPadding: const EdgeInsets.symmetric(vertical: 13),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: _pageBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: _pageBorder),
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
  const _OrdersTable({required this.orders, required this.onVerify});

  final List<_OrderData> orders;
  final ValueChanged<_OrderData> onVerify;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.pureWhite,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: _pageBorder),
      ),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: DataTable(
          headingRowHeight: 54,
          dataRowMinHeight: 78,
          dataRowMaxHeight: 78,
          horizontalMargin: 22,
          columnSpacing: 44,
          headingTextStyle: Theme.of(context).textTheme.labelSmall?.copyWith(
            color: AppColors.mediumGray,
            fontSize: 10,
            letterSpacing: 0.7,
          ),
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
                            Text(
                              order.customer,
                              style: Theme.of(context).textTheme.labelLarge,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              order.product,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                          ],
                        ),
                      ),
                    ),
                    DataCell(Text(order.date)),
                    DataCell(
                      Text(
                        order.total,
                        style: Theme.of(context).textTheme.labelLarge,
                      ),
                    ),
                    const DataCell(_WaitingBadge()),
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
  const _MobileOrderList({required this.orders, required this.onVerify});

  final List<_OrderData> orders;
  final ValueChanged<_OrderData> onVerify;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: orders
          .map(
            (order) => Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.pureWhite,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: _pageBorder),
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
                      const _WaitingBadge(),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    order.customer,
                    style: Theme.of(context).textTheme.labelLarge,
                  ),
                  const SizedBox(height: 3),
                  Text(
                    order.product,
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
                  _VerifyButton(expand: true, onPressed: () => onVerify(order)),
                ],
              ),
            ),
          )
          .toList(),
    );
  }
}

class _WaitingBadge extends StatelessWidget {
  const _WaitingBadge();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 6),
      decoration: BoxDecoration(
        color: const Color(0xFFFFE7D6),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        'MENUNGGU DP',
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
          color: const Color(0xFFB45309),
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
        padding: const EdgeInsets.symmetric(horizontal: 14),
      ),
    );

    return expand ? SizedBox(width: double.infinity, child: button) : button;
  }
}

class _OrderData {
  const _OrderData({
    required this.id,
    required this.customer,
    required this.product,
    required this.date,
    required this.total,
  });

  final String id;
  final String customer;
  final String product;
  final String date;
  final String total;
}
