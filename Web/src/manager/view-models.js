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
      this.model.searchPasswords();
      this.passwordDetailListView.render();
      this.passwordDetailGridOperation.render();
    };

    deletePassword = function (index) {
      this.model.removePassword(index);
      this.model.searchPasswords();
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
      this.model.setSearchContext(searchIn, searchText);
      this.model.searchPasswords();
      this.passwordDetailListView.render();
    };
  }
  resolver('manager.viewModel', ViewModel);
})(jQuery, window, $resolver);
