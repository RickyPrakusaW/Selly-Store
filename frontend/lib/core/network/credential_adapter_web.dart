import 'package:dio/browser.dart';
import 'package:dio/dio.dart';

void enableCredentialCookies(Dio dio) {
  dio.httpClientAdapter = BrowserHttpClientAdapter(withCredentials: true);
}
