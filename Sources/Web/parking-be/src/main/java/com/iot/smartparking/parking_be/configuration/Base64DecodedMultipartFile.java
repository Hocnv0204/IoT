package com.iot.smartparking.parking_be.configuration;

import org.springframework.web.multipart.MultipartFile;

import java.io.*;

public class Base64DecodedMultipartFile implements MultipartFile {

    private final byte[] fileContent;
    private final String fileName;

    public Base64DecodedMultipartFile(byte[] fileContent, String fileName) {
        this.fileContent = fileContent;
        this.fileName = fileName;
    }

    @Override
    public String getName() {
        return this.fileName;
    }

    @Override
    public String getOriginalFilename() {
        return this.fileName;
    }

    @Override
    public String getContentType() {
        return "image/jpeg";
    }

    @Override
    public boolean isEmpty() {
        return fileContent == null || fileContent.length == 0;
    }

    @Override
    public long getSize() {
        return fileContent.length;
    }

    @Override
    public byte[] getBytes() {
        return fileContent;
    }

    @Override
    public InputStream getInputStream() {
        return new ByteArrayInputStream(fileContent);
    }

    @Override
    public void transferTo(File dest) throws IOException {
        new FileOutputStream(dest).write(fileContent);
    }
}
