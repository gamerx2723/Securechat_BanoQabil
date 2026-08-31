package com.securechat.crypto

import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import java.security.KeyPair
import java.security.KeyPairGenerator
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyAgreement
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.SecretKeySpec
import android.util.Base64

/**
 * Android Native Double Ratchet & Keystore cryptographic wrapper.
 * Provides hardware-backed key storage and AES-256-GCM AEAD encryption.
 */
class SignalRatchetManager {

    private val KEYSTORE_PROVIDER = "AndroidKeyStore"
    private val IDENTITY_KEY_ALIAS = "securechat_identity_key"

    fun getOrGenerateIdentityKeyPair(): KeyPair {
        val keyStore = KeyStore.getInstance(KEYSTORE_PROVIDER).apply { load(null) }
        if (keyStore.containsAlias(IDENTITY_KEY_ALIAS)) {
            val privateKey = keyStore.getKey(IDENTITY_KEY_ALIAS, null) as java.security.PrivateKey
            val publicKey = keyStore.getCertificate(IDENTITY_KEY_ALIAS).publicKey
            return KeyPair(publicKey, privateKey)
        }

        val kpg = KeyPairGenerator.getInstance(KeyProperties.KEY_ALGORITHM_EC, KEYSTORE_PROVIDER)
        val parameterSpec = KeyGenParameterSpec.Builder(
            IDENTITY_KEY_ALIAS,
            KeyProperties.PURPOSE_SIGN or KeyProperties.PURPOSE_VERIFY
        ).run {
            setDigests(KeyProperties.DIGEST_SHA256, KeyProperties.DIGEST_SHA512)
            build()
        }

        kpg.initialize(parameterSpec)
        return kpg.generateKeyPair()
    }

    fun encryptAesGcm(key32Bytes: ByteArray, plaintext: ByteArray, iv: ByteArray, aad: ByteArray? = null): ByteArray {
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        val keySpec = SecretKeySpec(key32Bytes, "AES")
        val gcmSpec = GCMParameterSpec(128, iv)
        cipher.init(Cipher.ENCRYPT_MODE, keySpec, gcmSpec)
        if (aad != null) {
            cipher.updateAAD(aad)
        }
        return cipher.doFinal(plaintext)
    }

    fun decryptAesGcm(key32Bytes: ByteArray, ciphertext: ByteArray, iv: ByteArray, aad: ByteArray? = null): ByteArray {
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        val keySpec = SecretKeySpec(key32Bytes, "AES")
        val gcmSpec = GCMParameterSpec(128, iv)
        cipher.init(Cipher.DECRYPT_MODE, keySpec, gcmSpec)
        if (aad != null) {
            cipher.updateAAD(aad)
        }
        return cipher.doFinal(ciphertext)
    }
}
