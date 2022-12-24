
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