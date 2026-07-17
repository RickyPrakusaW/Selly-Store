import 'package:dio/dio.dart';

void enableCredentialCookies(Dio dio) {
  // Native clients manage cookies separately. Flutter Web uses the conditional
  // implementation backed by BrowserHttpClientAdapter.
}
