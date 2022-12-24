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
(function ($, resolver) {
    function view(model, vm) {
        var view = {};

        view.init = function () {
            var s = this;
            s.additionalDetailList = $("#additional-detail-list tbody");
            s.noRowMessageTml = _.template($("#no-row-message-tml").html());
            s.additionalDetailRowTml = _.template($("#additional-detail-row-tml").html());

            return s;
        };

        view.render = function () {
            var s = this,
                detailHtml = "",
                additionalDetails = model.getSelectedPasswordAdditionalDetails();
            if (additionalDetails.length === 0) {
                detailHtml = "<tr class='no-data'><td colspan='4'>" + s.noRowMessageTml() + "</td></tr>";
            }
            else {
                additionalDetails.forEach((additionalDetail, index) => {
                    detailHtml += s.additionalDetailRowTml({ ...additionalDetail, index });
                });
            }
            s.additionalDetailList.html(detailHtml);
            $(".delete-password-additional-detail").click(e => {
                var elem = $(e.target).closest("tr");
                vm.removePasswordAdditionalDetail(elem.data("index"));
            });
            return s;
        };

        view.get = function () {
            var s = this,
                additionalDetails = [];
            s.additionalDetailList.children('tr').each((i, trElem) => {
                var tr = $(trElem);
                if (!tr.hasClass("no-data")) {
                    additionalDetails.push({ key: tr.find('.key').val(), value: tr.find('.value').val() })
                }
            })
            return additionalDetails;
        };

        return view.init();
    }
    resolver("manager.passwordDetail", view);
})(jQuery, $resolver);
(function ($, resolver) {
    function view(model, vm) {
        var view = {};

        view.init = function () {
            var s = this;
            $("#add-password").click(_ => vm.showAddPassword());
            $("#upload-passwords").click(_ => vm.showSecretModal('upload'));
            $("#save-passwords").click(_ => vm.showSecretModal('download'));
            $("#search-passwords").click(_ => vm.searchPasswords($("#search-passwords-in").val(), $("#txt-search-password").val()));
            $("#txt-search-password").keyup(_ => vm.searchPasswords($("#search-passwords-in").val(), $("#txt-search-password").val()));
            return s;
        };

        view.render = function () {
            var s = this;
            $("#save-passwords span").toggleClass("d-none", !model.isDirty());
            return s;
        };

        return view.init();
    }
    resolver("manager.passwordDetailGridOperation", view);
})(jQuery, $resolver);
(function ($, resolver) {
    function view(model, vm) {
        var view = {};

        view.init = function () {
            var s = this;
            s.lblPasswordCount = $("#lbl-password-count");
            s.passwordDetailList = $("#password-detail-list .body");
            //s.gridFooter = $("#password-detail-list .footer");
            s.noRowMessageTml = _.template($("#no-row-message-tml").html());
            s.passwordRowTml = _.template($("#password-row-tml").html());
            s.paginationItemTml = _.template($("#pagination-item-tml").html());

            return s;
        };

        view.render = function () {
            var s = this,
                detailHtml = "",
                passwordListSource = model.getPasswordListSource(),
                passwordList = model.getPasswordList();
            if (passwordList.length === 0) {
                detailHtml = s.noRowMessageTml();
                //s.gridFooter.hide();
            }
            else {
                //s.gridFooter.show();
                passwordList.forEach((password, index) => {
                    detailHtml += s.passwordRowTml({ ...password, index });
                });
            }
            s.lblPasswordCount.text(`Showing ${passwordList.length} of ${passwordListSource.length} passwords.`);
            s.passwordDetailList.html(detailHtml);
            $(".edit-password").click(e => {
                var elem = $(e.target).closest(".row");
                vm.showEditPassword(elem.data("index"));
            });
            $(".delete-password").click(e => {
                var elem = $(e.target).closest(".row");
                vm.deletePassword(elem.data("index"));
            });
            $(".expand-password").click(e => {
                var elem = $(e.target);
                elem.children("i").toggleClass("fa-angle-down fa-angle-up");
                elem.closest(".row").next().children().each((i, e) => {
                    new bootstrap.Collapse(e);
                });
            });
            $(".toggle-password").click(e => {
                var elem = $(e.target).closest("div");
                elem.find("i").toggleClass("fa-eye fa-eye-slash");
                elem.children("span").toggleClass("d-none");
            });
            return s;
        };

        return view.init();
    }
    resolver("manager.passwordDetailGrid", view);
})(jQuery, $resolver);
(function ($, resolver) {
    function view(model, vm) {
        var view = {};

        view.init = function () {
            var s = this;
            s.passwordDetailModal = $("#password-detail-modal");
            s.modalTitle = $("#password-detail-title");
            s.txtLogin = $("#txtLogin");
            s.txtPassword = $("#txtPassword");

            $("#save-password").click(function () { vm.savePassword(); });
            $("#add-password-detail").click(function () { vm.addPasswordAdditionalDetail(); });

            return s;
        };

        view.show = function () {
            var s = this,
                selectedPassword = model.getSelectedPassword();

            s.passwordDetailModal.modal('show');
            if (selectedPassword.isNew) {
                s.modalTitle.text("Add New Password");
            }
            s.txtLogin.val(selectedPassword.login);
            s.txtPassword.val(selectedPassword.password);
            return s;
        };

        view.hide = function () {
            var s = this;
            s.passwordDetailModal.modal('hide');
        };

        view.get = function () {
            var s = this;
            return { login: s.txtLogin.val(), password: s.txtPassword.val() };
        };

        return view.init();
    }
    resolver("manager.passwordDetailModal", view);
})(jQuery, $resolver);
(function ($, resolver) {
    function view(model, vm) {
        var view = {};

        view.init = function () {
            var s = this;
            s.secretDownloadList = $("#secret-download-list tbody");
            s.secretUploadList = $("#secret-upload-list tbody");
            s.noRowMessageTml = _.template($("#no-row-message-tml").html());
            s.secretDownloadRowTml = _.template($("#secret-download-row-tml").html());
            s.secretUploadRowTml = _.template($("#secret-upload-row-tml").html());

            return s;
        };

        view.render = function () {
            var s = this,
                html = "",
                secretList = model.getSecretList(),
                secretRowTml = view.getSecretListRowTml(),
                secretListView = view.getSecretListView();

            s.secretDownloadList.parent().hide();
            s.secretUploadList.parent().hide();
            if (secretList.length === 0) {
                html = "<tr class='no-data'><td colspan='4'>" + s.noRowMessageTml() + "</td></tr>";
            }
            else {
                secretList.forEach((secret, index) => {
                    secret.confirmSecret = '';
                    html += secretRowTml({ ...secret, index });
                });
            }
            secretListView.html(html).parent().show();
            $(".delete-secret").click(e => {
                var elem = $(e.target).closest("tr");
                vm.removeSecret(elem.data("index"));
            });
            secretListView.find("input").change(e => {
                view.validate();
            });
            return s;
        };

        view.get = function () {
            var s = this,
                secretList = [],
                secretListView = view.getSecretListView();
            secretListView.children('tr').each((i, trElem) => {
                var tr = $(trElem);
                if (!tr.hasClass("no-data")) {
                    secretList.push({ secret: tr.find('.secret').val(), confirmSecret: tr.find('.confirm-secret').val() })
                }
            });
            return secretList;
        };

        view.validate = function () {
            var s = this,
                isValid = true,
                secretListView = view.getSecretListView();
            if (secretListView === s.secretUploadList) {
                return isValid;
            }

            secretListView.children('tr').each((i, trElem) => {
                var tr = $(trElem);
                if (tr.hasClass("no-data")) {
                    isValid = false;
                    return;
                }
                var secretElem = tr.find('.secret'),
                    confirmSecretElem = tr.find('.confirm-secret');
                if (secretElem.val() != confirmSecretElem.val()) {
                    isValid = false;
                    secretElem.addClass("is-invalid");
                    confirmSecretElem.addClass("is-invalid");
                }
                else {
                    secretElem.removeClass("is-invalid");
                    confirmSecretElem.removeClass("is-invalid");
                }
            });
            return isValid;
        };

        view.getSecretListView = function () {
            var s = this,
                modalType = model.getSecretModalType();
            return modalType == 'upload' ? s.secretUploadList : s.secretDownloadList;
        };

        view.getSecretListRowTml = function () {
            var s = this,
                modalType = model.getSecretModalType();
            return modalType == 'upload' ? s.secretUploadRowTml : s.secretDownloadRowTml;
        }

        return view.init();
    }
    resolver("manager.secretList", view);
})(jQuery, $resolver);
(function ($, resolver) {
    function view(model, vm) {
        var view = {};

        view.init = function () {
            var s = this;
            s.secretModal = $("#secret-modal");
            s.passwordListFile = $("#passwordListFile");
            s.passwordFilePanel = $(".password-file");
            s.modalTitle = $("#secret-modal .modal-title");
            s.proceedButtonIcon = $("#proceed .fa-solid");
            s.fileReader = new FileReader();
            s.fileContentDefer = null;
            s.fileReader.onload = function (e) {
                s.fileContentDefer.resolve(new Uint8Array(e.target.result));
            };
            s.fileReader.onerror = function (e) {
                // error occurred
                console.log('Error : ' + e.type);
            };

            $("#proceed").click(function () { vm.proceed(); });
            $("#add-secret").click(function () { vm.addSecret(); });

            return s;
        };

        view.show = function () {
            var s = this,
                modalType = model.getSecretModalType();

            if (modalType == 'upload') {
                s.modalTitle.text("Upload");
                s.passwordFilePanel.show();
                s.proceedButtonIcon.removeClass("fa-lock").addClass("fa-unlock");
            }
            else {
                s.modalTitle.text("Download");
                s.passwordFilePanel.hide();
                s.proceedButtonIcon.removeClass("fa-unlock").addClass("fa-lock");
            };
            s.secretModal.modal('show');
            return s;
        };

        view.hide = function () {
            var s = this;
            s.secretModal.modal('hide');
        };

        view.getAsync = async function () {
            var s = this;
            s.fileContentDefer = $.Deferred();
            if (s.passwordListFile[0].files.length > 0) {
                s.fileReader.readAsArrayBuffer(s.passwordListFile[0].files[0]);
            }
            else {
                s.fileContentDefer.resolve('');
            }
            return s.fileContentDefer;
        };

        view.downloadFile = function (content) {
            var a = document.getElementById('download-file');
            a.setAttribute("href", window.URL.createObjectURL(new Blob([content])));
            a.click();
        };

        view.showAlert = function () {
            var alert = $(".alert");
            alert.toggleClass("d-none", !model.isError());
            alert.text(model.getErrorMessage());

        };
        return view.init();
    }
    resolver("manager.secretModal", view);
})(jQuery, $resolver);
(function ($, resolver) {
    function view(model, vm) {
        var view = {};

        view.init = function () {
            var s = this;
            s.txtTags = $("#txtTags");
            s.tagTml = _.template($("#tag-tml").html());

            $(".tags").click(function () {
                $("#txtTag").focus();
            });
            $("#txtTag").keyup(function (e) {
                if (e.which == 13) {
                    if (!view.get().includes(e.target.value)) {
                        view.addTag(e.target.value);
                    }
                    e.target.value = "";
                }
            });
            return s;
        };

        view.render = function () {
            var s = this,
                tagList = model.getTagList();
            s.txtTags.find(".badge").remove();
            tagList.forEach(tag => {
                s.addTag(tag);
            });
            return s;
        };

        view.addTag = function (tag) {
            var s = this,
                elem = $(s.tagTml({ tag }));
            $("#txtTag").before(elem);
            elem.find(".delete").click(e => {
                $(e.target).closest(".badge").remove();
            });
        };

        view.get = function () {
            var s = this,
                tags = [];
            s.txtTags.find(".badge").each((i, e) => {
                tags.push($(e).text().trim());
            });
            return tags;
        };

        return view.init();
    }
    resolver("manager.tagList", view);
})(jQuery, $resolver);

(function (resolver) {
    function model() {
        var model = {},
            cryptoService = resolver("core.cryptoService");

        model.init = function () {
            var s = this;
            s.passwordListSource = [];
            s.passwordList = [];
            s.secretList = [];
            s.selectedPassword = null;
            s.selectedPasswordAdditionalDetails = null;
            s.secretModalType = "";
            s.dirty = false;
            s.error = false;
            s.errorMessage = "";
            return s;
        };

        model.getPasswordListSource = function () {
            var s = this;
            return s.passwordListSource;
        };

        model.getPasswordList = function () {
            var s = this;
            return s.passwordList;
        };

        model.addPassword = function (password, tags, additionalDetails) {
            var s = this;
            password.tags = tags;
            password.additionalDetails = additionalDetails;
            s.passwordList.push(password);
            s.dirty = true;
        };

        model.updatePassword = function (password, tags, additionalDetails) {
            var s = this;
            s.selectedPassword.login = password.login;
            s.selectedPassword.password = password.password;
            s.selectedPassword.tags = tags;
            s.selectedPassword.additionalDetails = additionalDetails;
            s.dirty = true;
        };

        model.savePassword = function (password, tags, additionalDetails) {
            var s = this;
            if (s.selectedPassword.isNew) {
                s.addPassword(password, tags, additionalDetails);
            }
            else {
                s.updatePassword(password, tags, additionalDetails);
            }
        }

        model.setSelectedPassword = function (index) {
            var s = this,
                newPassword = {
                    isNew: true,
                    login: '',
                    password: '',
                    tags: [],
                    additionalDetails: []
                };

            s.selectedPassword = index !== undefined ? s.passwordList[index] : newPassword;
            s.selectedPasswordAdditionalDetails = s.selectedPassword.additionalDetails;
        };

        model.getSelectedPassword = function () {
            var s = this;
            return s.selectedPassword;
        };

        model.getSelectedPasswordAdditionalDetails = function () {
            var s = this;
            return s.selectedPasswordAdditionalDetails;
        };

        model.removePassword = function (index) {
            var s = this;
            s.passwordList.splice(index, 1);
        };

        model.addPasswordAdditionalDetail = function (passwordAdditionalDetails) {
            var s = this;
            s.selectedPasswordAdditionalDetails = passwordAdditionalDetails;
            s.selectedPasswordAdditionalDetails.push({ key: '', value: '' });
        };

        model.removePasswordAdditionalDetail = function (passwordAdditionalDetails, index) {
            var s = this;
            s.selectedPasswordAdditionalDetails = passwordAdditionalDetails;
            s.selectedPasswordAdditionalDetails.splice(index, 1);
        };

        model.cloneSecretList = function () {
            var s = this;
            s.clonedSecretList = JSON.parse(JSON.stringify(s.secretList));
        };

        model.getSecretList = function () {
            var s = this;
            return s.clonedSecretList;
        };

        model.addSecret = function (secretList) {
            var s = this;
            s.clonedSecretList = secretList;
            s.clonedSecretList.push({ secret: '', confirmSecret: '' });
        };

        model.removeSecret = function (secretList, index) {
            var s = this;
            s.clonedSecretList = secretList;
            s.clonedSecretList.splice(index, 1);
        };

        model.processPasswordList = async function (encryptedContent, secretList) {
            var s = this;
            s.error = false;
            s.errorMessage = "";
            s.secretList = secretList;
            try {
                for (var i = secretList.length - 1; i >= 0; i--) {
                    encryptedContent = await cryptoService.decrypt(encryptedContent, secretList[i].secret);
                }
                s.passwordListSource = s.passwordList = JSON.parse(cryptoService.decode(encryptedContent));
            } catch (ex) {
                s.error = true;
                s.errorMessage = ex;
            }
        };

        model.encryptPasswordList = async function (secretList) {
            var s = this,
                passwordList = s.passwordListSource.map(_ => {
                    return {
                        login: _.login,
                        password: _.password,
                        tags: _.tags,
                        additionalDetails: _.additionalDetails
                    };
                }),
                encryptedContent = cryptoService.encode(JSON.stringify(passwordList));

            s.error = false;
            s.errorMessage = "";
            s.secretList = secretList;

            try {
                for (var i = 0; i < secretList.length; i++) {
                    encryptedContent = await cryptoService.encrypt(encryptedContent, secretList[i].secret);
                }
                s.dirty = false;
            } catch (ex) {
                s.error = true;
                s.errorMessage = ex;
            }
            return encryptedContent;
        };

        model.getTagList = function () {
            var s = this;
            return s.selectedPassword.tags;
        };

        model.addTag = function (tag) {
            var s = this,
                index = s.selectedPassword.tags.indexOf(tag);
            if (index > 0)
                return;
            s.selectedPassword.tags.push(tag);
            s.dirty = true;
        };

        model.removeTag = function (tag) {
            var s = this,
                index = s.selectedPassword.tags.indexOf(tag);
            s.selectedPassword.tags.splice(index, 1);
            s.dirty = true;
        };

        model.getSecretModalType = function () {
            var s = this;
            return s.secretModalType;
        };

        model.setSecretModalType = function (type) {
            var s = this;
            s.secretModalType = type;
            return type;
        };

        model.isDirty = function () {
            var s = this;
            return s.dirty;
        };

        model.isError = function () {
            var s = this;
            return s.error;
        };

        model.getErrorMessage = function () {
            var s = this;
            return s.errorMessage;
        };

        model.searchPasswords = function (searchIn, searchText) {
            var s = this,
                searchTextRegExp = new RegExp(searchText, "i");
            if (searchText == "") {
                s.passwordList = s.passwordListSource;
                return;
            }
            s.passwordList = s.passwordListSource.filter(_ => {
                if (searchIn == 'login') {
                    return _.login.search(searchTextRegExp) != -1;
                }
                else if (searchIn == 'password') {
                    return _.password.search(searchTextRegExp) != -1;
                }
                else if (searchIn == 'tags') {
                    return _.tags.some(t => t.search(searchTextRegExp) != -1);
                } else {
                    return _.login.search(searchTextRegExp) != -1 ||
                        _.password.search(searchTextRegExp) != -1 ||
                        _.tags.some(t => t.search(searchTextRegExp) != -1) ||
                        _.additionalDetails.some(d => d.key.search(searchTextRegExp) != -1 || d.value.search(searchTextRegExp) != -1);
                }
            });
        };

        return model.init();
    }
    resolver('manager.model', model);
})($resolver);
(function ($, window, resolver) {
  class ViewModel {
    model = resolver('manager.model');
    passwordDetailGridOperation = resolver('manager.passwordDetailGridOperation');
    passwordDetailListView = resolver('manager.passwordDetailGrid');
    secretModal = resolver("manager.secretModal");
    secretListView = resolver("manager.secretList");
    passwordDetailModal = resolver("manager.passwordDetailModal");
    additionalDetailView = resolver("manager.passwordDetail");
    tagListView = resolver("manager.tagList");

    constructor(route, params) {
      this.model = this.model();
      this.passwordDetailGridOperation = this.passwordDetailGridOperation(this.model, this);
      this.passwordDetailListView = this.passwordDetailListView(this.model, this);
      this.additionalDetailView = this.additionalDetailView(this.model, this);
      this.passwordDetailModal = this.passwordDetailModal(this.model, this);
      this.secretModal = this.secretModal(this.model, this);
      this.secretListView = this.secretListView(this.model, this);
      this.tagListView = this.tagListView(this.model, this);
      this.passwordDetailGridOperation.render();
      this.passwordDetailListView.render();
    }

    showAddPassword = function () {
      this.model.setSelectedPassword();
      this.passwordDetailModal.show();
      this.additionalDetailView.render();
      this.tagListView.render();
    };

    showEditPassword = function (index) {
      this.model.setSelectedPassword(index);
      this.passwordDetailModal.show();
      this.additionalDetailView.render();
      this.tagListView.render();
    };

    savePassword = function () {
      var password = this.passwordDetailModal.get(),
        tags = this.tagListView.get(),
        additionalDetails = this.additionalDetailView.get();
      this.model.savePassword(password, tags, additionalDetails);
      this.passwordDetailModal.hide();
      this.passwordDetailListView.render();
      this.passwordDetailGridOperation.render();
    };

    deletePassword = function (index) {
      this.model.removePassword(index);
      this.passwordDetailListView.render();
      this.passwordDetailGridOperation.render();
    };

    addPasswordAdditionalDetail = function () {
      this.model.addPasswordAdditionalDetail(this.additionalDetailView.get());
      this.additionalDetailView.render();
    };

    removePasswordAdditionalDetail = function (index) {
      this.model.removePasswordAdditionalDetail(this.additionalDetailView.get(), index);
      this.additionalDetailView.render();
    };

    showSecretModal = function (type) {
      this.model.setSecretModalType(type);
      this.model.cloneSecretList();
      this.secretModal.show();
      this.secretListView.render();
    };

    proceed = async function () {
      if (!this.secretListView.validate()) {
        return;
      }
      var type = this.model.getSecretModalType(),
        secretList = this.secretListView.get();

      if (type == 'upload') {
        var encryptedContent = await this.secretModal.getAsync();
        await this.model.processPasswordList(encryptedContent, secretList);
      } else {
        var encryptedContent = await this.model.encryptPasswordList(secretList);
        this.secretModal.downloadFile(encryptedContent);
      }
      this.secretModal.showAlert();
      if (this.model.isError()) {
        return;
      }
      this.secretModal.hide();
      this.passwordDetailListView.render();
      this.passwordDetailGridOperation.render();
    };

    addSecret = function () {
      this.model.addSecret(this.secretListView.get());
      this.secretListView.render();
      this.secretListView.validate();
    };

    removeSecret = function (index) {
      this.model.removeSecret(this.secretListView.get(), index);
      this.secretListView.render();
      this.secretListView.validate();
    };

    searchPasswords = function (searchIn, searchText) {
      this.model.searchPasswords(searchIn, searchText);
      this.passwordDetailListView.render();
    };
  }
  resolver('manager.viewModel', ViewModel);
})(jQuery, window, $resolver);

(function ($, resolver) {
  var routes = {},
    defaultRoute = 'manager';

  routes['manager'] = {
    url: '#/',
    templateUrl: 'manager/index.html',
    viewModel: resolver("manager.viewModel"),
  };

  routes['learn'] = {
    url: '#/learn',
    templateUrl: 'learn/index.html'
  };

  $.router
    .setData(routes)
    .setDefault(defaultRoute)
    .onRouteChanged(function (e, route, param) {
      if (route.viewModel) {
        new route.viewModel(route, param);
      }
    });

  $.when($.ready).then(function () {
    $.router.run('.my-view', defaultRoute);
  });

})(jQuery, $resolver);
