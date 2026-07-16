import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
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
  setUp(cartNotifier.clearCart);

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

    await tester.tap(find.byKey(const ValueKey('continue-to-checkout')));
    await tester.pumpAndSettle();
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
    expect(find.text('Rp 100.000'), findsWidgets);
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
