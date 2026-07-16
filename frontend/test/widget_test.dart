import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:florist_frontend/core/auth_state.dart';
import 'package:florist_frontend/core/cart_state.dart';
import 'package:florist_frontend/features/home/domain/product_preview.dart';
import 'package:florist_frontend/main.dart';
import 'package:lucide_flutter/lucide_flutter.dart';

const _testProduct = ProductPreview(
  name: 'Buket Test',
  category: 'Bunga',
  price: 100000,
  stockStatus: ProductStockStatus.readyStock,
  visual: ProductVisual.bouquet,
);

void main() {
  setUp(() {
    cartNotifier.clearCart();
    authNotifier.logout();
  });

  test('auth notifier supports mock login, register, and logout', () {
    final notifier = AuthNotifier();

    notifier.login('seli@example.com', 'password');
    expect(notifier.isLoggedIn, isTrue);
    expect(notifier.userName, 'Seli');
    expect(notifier.userEmail, 'seli@example.com');

    notifier.register(
      'Seli Florist',
      'owner@seli.test',
      '081234567890',
      'password',
    );
    expect(notifier.userName, 'Seli Florist');
    expect(notifier.userEmail, 'owner@seli.test');

    notifier.logout();
    expect(notifier.isLoggedIn, isFalse);
    expect(notifier.userName, isNull);
  });

  test('cart notifier calculates item totals, shipping, and DP', () {
    final notifier = CartNotifier();
    const standardItem = CartItem(
      product: _testProduct,
      variant: 'Standar',
      customNote: '',
      bookingDate: null,
      quantity: 2,
    );
    const premiumItem = CartItem(
      product: _testProduct,
      variant: 'Premium',
      customNote: 'Pita putih',
      bookingDate: null,
      quantity: 1,
    );

    notifier
      ..addItem(standardItem)
      ..addItem(premiumItem);

    expect(notifier.totalQuantity, 3);
    expect(notifier.subtotal, 400000);
    expect(notifier.ongkir, 15000);
    expect(notifier.total, 415000);
    expect(notifier.downPayment, 207500);
    expect(notifier.remainingPayment, 207500);

    notifier.setDelivery(false);
    expect(notifier.ongkir, 0);
    expect(notifier.total, 400000);
  });

  test('voucher validates minimum purchase and updates total', () {
    final notifier = CartNotifier();
    const item = CartItem(
      product: _testProduct,
      variant: 'Standar',
      customNote: '',
      bookingDate: null,
      quantity: 1,
    );

    notifier.addItem(item);
    expect(notifier.applyVoucher('SELIPINK'), 'Minimal pembelian Rp 200.000');

    notifier.addItem(item);
    expect(notifier.applyVoucher('selipink'), isNull);
    expect(notifier.appliedVoucherCode, 'SELIPINK');
    expect(notifier.discountAmount, 20000);
    expect(notifier.total, 195000);
    expect(notifier.downPayment, 97500);

    notifier.updateQuantity(notifier.value.first, 1);
    expect(notifier.appliedVoucherCode, isNull);
    expect(notifier.discountAmount, 0);
  });

  testWidgets('product detail adds a configured product to the global cart', (
    tester,
  ) async {
    await _setMobileViewport(tester);
    await tester.pumpWidget(const FloristApp());
    await tester.pump();

    expect(find.byKey(const ValueKey('cart-badge-count')), findsNothing);

    await tester.scrollUntilVisible(
      find.text('Tambah').first,
      300,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.tap(find.text('Tambah').first);
    await tester.pumpAndSettle();

    expect(find.text('Detail Produk'), findsOneWidget);
    expect(find.text('Tambah ke Keranjang'), findsOneWidget);

    await tester.tap(find.byKey(const ValueKey('add-to-cart-detail')));
    await tester.pumpAndSettle();

    expect(cartNotifier.totalQuantity, 1);
    expect(
      tester.widget<Text>(find.byKey(const ValueKey('cart-badge-count'))).data,
      '1',
    );
  });

  testWidgets('cart and checkout complete the three-step flow', (tester) async {
    await _setMobileViewport(tester);
    cartNotifier.addItem(
      const CartItem(
        product: _testProduct,
        variant: 'Standar',
        customNote: 'Selamat ulang tahun',
        bookingDate: null,
        quantity: 1,
      ),
    );

    await tester.pumpWidget(const FloristApp());
    await tester.pump();
    await tester.tap(find.byIcon(LucideIcons.shoppingCart));
    await tester.pumpAndSettle();

    expect(find.text('Keranjang Belanja'), findsOneWidget);
    expect(find.text('Buket Test'), findsOneWidget);
    expect(cartNotifier.downPayment, 57500);

    await tester.tap(
      find.byKey(const ValueKey('cart-increase-Buket Test-Standar')),
    );
    await tester.pump();
    expect(cartNotifier.totalQuantity, 2);
    expect(cartNotifier.downPayment, 107500);

    await tester.scrollUntilVisible(
      find.byKey(const ValueKey('voucher-input')),
      300,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.enterText(
      find.byKey(const ValueKey('voucher-input')),
      'SELIPINK',
    );
    await tester.tap(find.byKey(const ValueKey('apply-voucher')));
    await tester.pump();
    expect(cartNotifier.discountAmount, 20000);
    expect(find.textContaining('berhasil digunakan'), findsOneWidget);
    expect(cartNotifier.downPayment, 97500);

    await tester.tap(find.byKey(const ValueKey('continue-to-checkout')));
    await tester.pumpAndSettle();
    expect(find.text('Selangkah lagi'), findsOneWidget);
    expect(authNotifier.isLoggedIn, isFalse);

    await tester.enterText(
      find.byKey(const ValueKey('login-email')),
      'seli@example.com',
    );
    await tester.enterText(
      find.byKey(const ValueKey('login-password')),
      'password',
    );
    await tester.tap(find.byKey(const ValueKey('submit-login')));
    await tester.pumpAndSettle();
    expect(authNotifier.isLoggedIn, isTrue);
    expect(find.text('Detail Pengiriman'), findsOneWidget);

    await tester.tap(find.text('Ambil di Toko'));
    await tester.pump();
    expect(cartNotifier.ongkir, 0);

    final fields = find.byType(TextFormField);
    expect(fields, findsNWidgets(2));
    await tester.enterText(fields.at(0), 'Seli');
    await tester.enterText(fields.at(1), '081234567890');
    await tester.ensureVisible(find.text('Lanjut ke Pembayaran'));
    await tester.tap(find.text('Lanjut ke Pembayaran'));
    await tester.pumpAndSettle();

    expect(find.text('Pembayaran DP'), findsWidgets);
    expect(find.text('Rp 90.000'), findsWidgets);
    await tester.tap(find.text('Upload Bukti Transfer'));
    await tester.pump();
    expect(find.text('preview-bukti-transfer.jpg'), findsOneWidget);

    await tester.ensureVisible(find.text('Konfirmasi Pembayaran'));
    await tester.tap(find.text('Konfirmasi Pembayaran'));
    await tester.pumpAndSettle();
    expect(find.text('Pesanan berhasil dibuat'), findsOneWidget);

    await tester.tap(find.text('Kembali ke Beranda'));
    await tester.pumpAndSettle();
    expect(cartNotifier.value, isEmpty);
    expect(find.text('Seli Florist'), findsOneWidget);
  });

  testWidgets('registration tab creates account and continues checkout', (
    tester,
  ) async {
    await _setMobileViewport(tester);
    cartNotifier.addItem(
      const CartItem(
        product: _testProduct,
        variant: 'Standar',
        customNote: '',
        bookingDate: null,
        quantity: 2,
      ),
    );

    await tester.pumpWidget(const FloristApp());
    await tester.pump();
    await tester.tap(find.byIcon(LucideIcons.shoppingCart));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const ValueKey('continue-to-checkout')));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Daftar Baru'));
    await tester.pump(const Duration(milliseconds: 300));
    expect(find.byKey(const ValueKey('register-form')), findsOneWidget);

    await tester.enterText(
      find.byKey(const ValueKey('register-name')),
      'Seli Baru',
    );
    await tester.enterText(
      find.byKey(const ValueKey('register-email')),
      'baru@seli.test',
    );
    await tester.enterText(
      find.byKey(const ValueKey('register-phone')),
      '081234567890',
    );
    await tester.enterText(
      find.byKey(const ValueKey('register-password')),
      'password',
    );
    await tester.ensureVisible(find.byKey(const ValueKey('submit-register')));
    await tester.tap(find.byKey(const ValueKey('submit-register')));
    await tester.pumpAndSettle();

    expect(authNotifier.isLoggedIn, isTrue);
    expect(authNotifier.userName, 'Seli Baru');
    expect(find.text('Detail Pengiriman'), findsOneWidget);
  });

  testWidgets('home page stays overflow-free on a narrow mobile viewport', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(320, 800);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(const FloristApp());
    await tester.pump();

    await tester.scrollUntilVisible(
      find.text('Tambah').first,
      300,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.pump();

    expect(find.text('Ready Stock'), findsWidgets);
    expect(find.text('Pre-Order'), findsWidgets);
    expect(tester.takeException(), isNull);
  });
}

Future<void> _setMobileViewport(WidgetTester tester) async {
  tester.view.physicalSize = const Size(390, 844);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.resetPhysicalSize);
  addTearDown(tester.view.resetDevicePixelRatio);
}
