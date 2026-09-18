package com.onebase.extraction;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.io.ByteArrayOutputStream;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.zip.GZIPInputStream;
import java.util.zip.GZIPOutputStream;

@org.springframework.stereotype.Service
public class CryptoService {

    private static final String SECRET_KEY = "onebase-invoice-poc-2026-secure-key!";
    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH = 128;

    private SecretKeySpec getSecretKey() throws Exception {
        byte[] keyBytes = Arrays.copyOf(SECRET_KEY.getBytes(StandardCharsets.UTF_8), 32);
        return new SecretKeySpec(keyBytes, "AES");
    }

    public String decryptAndDecompress(byte[] payload) throws Exception {
        ByteBuffer buffer = ByteBuffer.wrap(payload);
        byte version = buffer.get();

        byte[] iv = new byte[GCM_IV_LENGTH];
        buffer.get(iv);

        byte[] encrypted = new byte[buffer.remaining()];
        buffer.get(encrypted);

        SecretKeySpec key = getSecretKey();
        Cipher cipher = Cipher.getInstance(ALGORITHM);
        cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(GCM_TAG_LENGTH, iv));
        byte[] compressed = cipher.doFinal(encrypted);

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (GZIPInputStream gis = new GZIPInputStream(new java.io.ByteArrayInputStream(compressed))) {
            byte[] buf = new byte[1024];
            int n;
            while ((n = gis.read(buf)) != -1) {
                out.write(buf, 0, n);
            }
        }

        return out.toString(StandardCharsets.UTF_8.name());
    }

    public byte[] compressAndEncrypt(String json) throws Exception {
        // GZIP compress
        ByteArrayOutputStream byteOut = new ByteArrayOutputStream();
        try (GZIPOutputStream gos = new GZIPOutputStream(byteOut)) {
            gos.write(json.getBytes(StandardCharsets.UTF_8));
        }
        byte[] compressed = byteOut.toByteArray();

        // AES-GCM encrypt
        byte[] iv = new byte[GCM_IV_LENGTH];
        new java.security.SecureRandom().nextBytes(iv);

        SecretKeySpec key = getSecretKey();
        Cipher cipher = Cipher.getInstance(ALGORITHM);
        cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(GCM_TAG_LENGTH, iv));
        byte[] encrypted = cipher.doFinal(compressed);

        // Build payload: version(1) + iv(12) + encrypted(N)
        ByteBuffer result = ByteBuffer.allocate(1 + iv.length + encrypted.length);
        result.put((byte) 1);
        result.put(iv);
        result.put(encrypted);

        return result.array();
    }
}
