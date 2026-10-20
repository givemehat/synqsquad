# Proguard rules for RIVQ Trusted Web Activity
-keepattributes *Annotation*
-keepclassmembers class * {
    @org.chromium.base.annotations.CalledByNative <methods>;
}
-dontwarn com.google.androidbrowserhelper.**
-keep class com.google.androidbrowserhelper.** { *; }
-dontwarn androidx.browser.**
-keep class androidx.browser.** { *; }
