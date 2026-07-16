import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:florist_frontend/main.dart';

void main() {
  testWidgets('home page shows florist sections and updates cart badge', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(const FloristApp());
    await tester.pump();

    expect(find.text('Seli Florist'), findsOneWidget);
    expect(find.text('Belanja Sekarang'), findsOneWidget);
    expect(find.text('Kategori Produk'), findsOneWidget);
    expect(find.text('Produk Unggulan'), findsOneWidget);
    expect(find.byKey(const ValueKey('cart-badge-count')), findsOneWidget);
    expect(
      tester.widget<Text>(find.byKey(const ValueKey('cart-badge-count'))).data,
      '2',
    );

    await tester.ensureVisible(find.text('Tambah').first);
    await tester.tap(find.text('Tambah').first);
    await tester.pump();

    expect(
      tester.widget<Text>(find.byKey(const ValueKey('cart-badge-count'))).data,
      '3',
    );
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
