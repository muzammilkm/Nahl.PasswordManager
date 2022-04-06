(function (resolver) {
    class CryptoService {

        AuthPasswordSaltByteSize = 128 / 8;
        PasswordSaltByteSize = 128 / 8;
        NonceSaltByteSize = 96 / 8;
        TagByteSize = 128 / 8;
        SignatureByteSize = 256 / 8;

        PasswordIterationCount = 100_000;

        CipherTextStructure = [
            this.AuthPasswordSaltByteSize,
            this.AuthPasswordSaltByteSize + this.PasswordSaltByteSize,
            this.AuthPasswordSaltByteSize + this.PasswordSaltByteSize + this.NonceSaltByteSize];
        MinimumEncryptedMessageByteSize =
            this.AuthPasswordSaltByteSize + this.PasswordSaltByteSize +
            this.NonceSaltByteSize + 0 + this.TagByteSize + this.SignatureByteSize;

        enc = new TextEncoder();
        dec = new TextDecoder();

        bytesToBase64 = (buffer) => btoa(String.fromCharCode.apply(null, buffer));
        base64Bytes = (str) => Uint8Array.from(atob(str), (c) => c.charCodeAt(null));

        getPasswordKey = (password) =>
            window.crypto.subtle.importKey("raw", this.enc.encode(password),
                { name: 'PBKDF2' }, false, ['deriveKey']);

        deriveKey = (passwordKey, salt, keyType, keyUsage) =>
            window.crypto.subtle.deriveKey(
                {
                    name: "PBKDF2",
                    salt: salt,
                    iterations: this.PasswordIterationCount,
                    hash: "SHA-256",
                },
                passwordKey,
                keyType,
                false,
                keyUsage
            );
        generateRandomBytes = (noOfBytes) => window.crypto.getRandomValues(new Uint8Array(noOfBytes));

        encrypt = async (toEncryptBytes, password) => {
            const authKeySalt = this.generateRandomBytes(this.AuthPasswordSaltByteSize);
            const keySalt = this.generateRandomBytes(this.PasswordSaltByteSize);
            const nonce = this.generateRandomBytes(this.NonceSaltByteSize);

            const passwordKey = await this.getPasswordKey(password);

            // encryption
            const key = await this.deriveKey(passwordKey, keySalt,
                { name: "AES-GCM", length: 256 }, ["encrypt"]);
            const encryptedContent = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce },
                key, toEncryptBytes);
            const cipherText = new Uint8Array(encryptedContent);
            const dataBuffer = new Uint8Array([...authKeySalt, ...keySalt, ...nonce, ...cipherText]);

            // sign
            const authKey = await this.deriveKey(passwordKey, authKeySalt,
                { "name": 'HMAC', hash: { name: "SHA-256" }, length: 256 }, ["sign"]);
            const signature = await window.crypto.subtle.sign({ name: "HMAC" }, authKey, dataBuffer);

            return new Uint8Array([...dataBuffer, ...new Uint8Array(signature)]);
        };

        encode = (toEncryptString) => this.enc.encode(toEncryptString);

        decrypt = async (toDecryptBytes, password) => {
            const dataBuffer = toDecryptBytes.subarray(0, toDecryptBytes.length - this.SignatureByteSize);
            const authKeySalt = dataBuffer.subarray(0, this.CipherTextStructure[0]);
            const keySalt = dataBuffer.subarray(this.CipherTextStructure[0], this.CipherTextStructure[1]);
            const nonce = dataBuffer.subarray(this.CipherTextStructure[1], this.CipherTextStructure[2]);
            const cipherText = dataBuffer.subarray(this.CipherTextStructure[2]);
            const signature = toDecryptBytes.subarray(dataBuffer.length);

            const passwordKey = await this.getPasswordKey(password);

            // verify
            const authKey = await this.deriveKey(passwordKey, authKeySalt, { "name": 'HMAC', hash: { name: "SHA-256" }, length: 256 }, ["sign", "verify"]);
            const valid = await window.crypto.subtle.verify({ name: "HMAC" }, authKey, signature, dataBuffer);
            if (!valid) {
                throw "Password validation failed.";
            }

            // decryption
            const key = await this.deriveKey(passwordKey, keySalt, { name: "AES-GCM", length: 256 }, ["encrypt", "decrypt"]);
            const decryptedText = await crypto.subtle.decrypt({ name: "AES-GCM", iv: nonce }, key, cipherText);

            return new Uint8Array(decryptedText);
        };

        decode = (toDecryptBytes) => this.dec.decode(toDecryptBytes);


    }
    resolver('core.cryptoService', new CryptoService());
})($resolver);