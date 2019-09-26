const assert = require('assert');
const pauseTime = 1000;
let namespaceSelectionButton, breadcrumbHeader, newNamespaceOption;

describe('namespace selection test', function() {
  it('should have `default` namespace selected on dashboard open', () => {
    browser.url(global.dashboardAddress);
    namespaceSelectionButton = $('#namespace-selection-button')
    const selectedNamespace = namespaceSelectionButton.getText().toLowerCase();
    assert.equal(selectedNamespace, "default")
  })
  it('should open a menu when namespace selection button is clicked', () => {
    namespaceSelectionButton.click();
    browser.pause(pauseTime)
    newNamespaceOption = $('#linkerd-namespace-option')
    newNamespaceOption.click()
    browser.pause(pauseTime)
  })
  it('should navigate to a new namespace if a different namespace is selected', () => {
    const newSelectedNamespace = namespaceSelectionButton.getText().toLowerCase();
    assert.equal(newSelectedNamespace, "linkerd")
    const resourceViewButton = $('#deployments-button')
    resourceViewButton.click()
    breadcrumbHeader = $('#toolbar');
    assert.equal(breadcrumbHeader.getText(), "Namespace > linkerd > Deployment")
  })
  it('should open a confirmation dialog if new namespace is selected when viewing a resource detail page', () => {
    const resourceDetailLink = $('#linkerd-web-row a')
    resourceDetailLink.click();
    browser.pause(pauseTime)
    namespaceSelectionButton.click();
    newNamespaceOption = $('#default-namespace-option')
    newNamespaceOption.click();
    let namespaceConfirmationDialogTitle = $('#form-dialog-title').getText()
    assert.equal(namespaceConfirmationDialogTitle, "Change namespace?")
  })
  it('should close the confirmation dialog if cancel button is clicked', () => {
    let cancelNamespaceChangeButton = $('#cancel-namespace-change')
    cancelNamespaceChangeButton.click();
    assert.equal(breadcrumbHeader.getText(), "Namespace > linkerd > deployment/linkerd-web")
  })
  it('should navigate to the namespace detail page for new namespace if confirmation button is clicked', () => {
    browser.pause(pauseTime)
    namespaceSelectionButton.click();
    browser.pause(pauseTime)
    newNamespaceOption.click();
    let confirmNamespaceChangeButton = $('#confirm-namespace-change')
    confirmNamespaceChangeButton.click();
    browser.pause(pauseTime)
    assert.equal(breadcrumbHeader.getText(), "Namespace > default")
  }) 
});
