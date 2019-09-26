const assert = require('assert');

describe('url detection and routing test', function() {
  it('namespace selection button should detect namespace in URL', () => {
    browser.url(global.dashboardAddress + '/namespaces/linkerd/pods');
    namespaceSelectionButton = $('#namespace-selection-button')
    const selectedNamespace = namespaceSelectionButton.getText().toLowerCase();
    assert.equal(selectedNamespace, "linkerd")
  });
  it('clicking the linkerd logo on top left should redirect to namespaces view', () => {
    const linkerdWordLogo = $('.linkerd-word-logo');
    linkerdWordLogo.click();
    const currentUrl = browser.getUrl()
    assert.equal(currentUrl, global.dashboardAddress + '/namespaces')
  })
});
