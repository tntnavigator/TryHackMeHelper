import SafariServices

class ViewController: NSViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        
        SFSafariExtensionManager.getStateOfSafariExtension(withIdentifier: "your.extension.identifier") { (state, error) in
            guard let state = state, error == nil else {
                // Handle error
                return
            }
            
            DispatchQueue.main.async {
                self.updateExtensionState(state.isEnabled)
            }
        }
    }
    
    func updateExtensionState(_ enabled: Bool) {
        // Update UI based on extension state
        let webView = self.view as? WKWebView
        webView?.evaluateJavaScript("show('mac', \(enabled), true)", completionHandler: nil)
    }
} 