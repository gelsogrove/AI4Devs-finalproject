#!/bin/bash

# 🚀 Gusto Italiano - Chatbot Export Script
# This script creates a standalone chatbot widget for integration into other websites

echo "🤖 Exporting Gusto Italiano Chatbot Widget..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Get the script directory and navigate to project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Navigate to project root
cd "$PROJECT_ROOT"

# Create export directory
EXPORT_DIR="chatbot-widget-export"
print_status "Creating export directory: $EXPORT_DIR"
rm -rf "$EXPORT_DIR"
mkdir -p "$EXPORT_DIR"

# Step 1: Create the standalone chatbot HTML
print_status "Creating standalone chatbot HTML..."
cat > "$EXPORT_DIR/chatbot-widget.html" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gusto Italiano Chatbot Widget</title>
    <style>
        /* Chatbot Widget Styles */
        .gusto-chatbot-widget {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 350px;
            height: 500px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            border: 1px solid #e5e7eb;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            z-index: 10000;
            display: none;
            flex-direction: column;
        }

        .gusto-chatbot-widget.open {
            display: flex;
        }

        .gusto-chatbot-header {
            background: linear-gradient(135deg, #059669, #10b981);
            color: white;
            padding: 16px;
            border-radius: 12px 12px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .gusto-chatbot-title {
            font-weight: 600;
            font-size: 16px;
        }

        .gusto-chatbot-close {
            background: none;
            border: none;
            color: white;
            font-size: 20px;
            cursor: pointer;
            padding: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .gusto-chatbot-messages {
            flex: 1;
            padding: 16px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .gusto-message {
            max-width: 80%;
            padding: 12px 16px;
            border-radius: 18px;
            font-size: 14px;
            line-height: 1.4;
        }

        .gusto-message.user {
            background: #059669;
            color: white;
            align-self: flex-end;
            border-bottom-right-radius: 4px;
        }

        .gusto-message.assistant {
            background: #f3f4f6;
            color: #374151;
            align-self: flex-start;
            border-bottom-left-radius: 4px;
        }

        .gusto-chatbot-input-area {
            padding: 16px;
            border-top: 1px solid #e5e7eb;
            display: flex;
            gap: 8px;
        }

        .gusto-chatbot-input {
            flex: 1;
            padding: 12px 16px;
            border: 1px solid #d1d5db;
            border-radius: 24px;
            outline: none;
            font-size: 14px;
        }

        .gusto-chatbot-input:focus {
            border-color: #059669;
        }

        .gusto-chatbot-send {
            background: #059669;
            color: white;
            border: none;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .gusto-chatbot-send:hover {
            background: #047857;
        }

        .gusto-chatbot-toggle {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #059669, #10b981);
            color: white;
            border: none;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 4px 16px rgba(5, 150, 105, 0.3);
            z-index: 10001;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
        }

        .gusto-chatbot-toggle:hover {
            transform: scale(1.05);
        }

        .gusto-loading {
            display: flex;
            gap: 4px;
            padding: 12px 16px;
        }

        .gusto-loading-dot {
            width: 8px;
            height: 8px;
            background: #9ca3af;
            border-radius: 50%;
            animation: gusto-bounce 1.4s ease-in-out infinite both;
        }

        .gusto-loading-dot:nth-child(1) { animation-delay: -0.32s; }
        .gusto-loading-dot:nth-child(2) { animation-delay: -0.16s; }

        @keyframes gusto-bounce {
            0%, 80%, 100% { transform: scale(0); }
            40% { transform: scale(1); }
        }

        /* Mobile responsive */
        @media (max-width: 480px) {
            .gusto-chatbot-widget {
                width: calc(100vw - 40px);
                height: calc(100vh - 40px);
                bottom: 20px;
                right: 20px;
                left: 20px;
            }
        }
    </style>
</head>
<body>
    <!-- Chatbot Toggle Button -->
    <button class="gusto-chatbot-toggle" onclick="toggleChatbot()">
        💬
    </button>

    <!-- Chatbot Widget -->
    <div class="gusto-chatbot-widget" id="gustoChatbot">
        <div class="gusto-chatbot-header">
            <div class="gusto-chatbot-title">🇮🇹 Sofia - Gusto Italiano</div>
            <button class="gusto-chatbot-close" onclick="toggleChatbot()">×</button>
        </div>
        
        <div class="gusto-chatbot-messages" id="gustoMessages">
            <div class="gusto-message assistant">
                Ciao! 👋 I'm Sofia, your Italian food expert. Ask me about our wines, cheeses, or any questions about Gusto Italiano!
            </div>
        </div>
        
        <div class="gusto-chatbot-input-area">
            <input 
                type="text" 
                class="gusto-chatbot-input" 
                id="gustoInput" 
                placeholder="Ask me about Italian products..."
                onkeypress="handleKeyPress(event)"
            >
            <button class="gusto-chatbot-send" onclick="sendMessage()">
                ➤
            </button>
        </div>
    </div>

    <script>
        // Configuration - Update these URLs to match your deployment
        const CHATBOT_CONFIG = {
            apiUrl: 'http://localhost:8080/api/chat', // Update this to your production API URL
            maxRetries: 3,
            retryDelay: 1000
        };

        let isOpen = false;
        let isLoading = false;

        function toggleChatbot() {
            const widget = document.getElementById('gustoChatbot');
            isOpen = !isOpen;
            
            if (isOpen) {
                widget.classList.add('open');
                document.getElementById('gustoInput').focus();
            } else {
                widget.classList.remove('open');
            }
        }

        function handleKeyPress(event) {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
            }
        }

        function addMessage(content, isUser = false) {
            const messagesContainer = document.getElementById('gustoMessages');
            const messageDiv = document.createElement('div');
            messageDiv.className = `gusto-message ${isUser ? 'user' : 'assistant'}`;
            messageDiv.textContent = content;
            messagesContainer.appendChild(messageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        function addLoadingMessage() {
            const messagesContainer = document.getElementById('gustoMessages');
            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'gusto-message assistant';
            loadingDiv.id = 'gustoLoading';
            loadingDiv.innerHTML = `
                <div class="gusto-loading">
                    <div class="gusto-loading-dot"></div>
                    <div class="gusto-loading-dot"></div>
                    <div class="gusto-loading-dot"></div>
                </div>
            `;
            messagesContainer.appendChild(loadingDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        function removeLoadingMessage() {
            const loadingElement = document.getElementById('gustoLoading');
            if (loadingElement) {
                loadingElement.remove();
            }
        }

        async function sendMessage() {
            if (isLoading) return;

            const input = document.getElementById('gustoInput');
            const message = input.value.trim();
            
            if (!message) return;

            // Add user message
            addMessage(message, true);
            input.value = '';
            isLoading = true;

            // Add loading indicator
            addLoadingMessage();

            try {
                const response = await fetch(CHATBOT_CONFIG.apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        messages: [{ role: 'user', content: message }]
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                removeLoadingMessage();
                
                if (data.response) {
                    addMessage(data.response);
                } else {
                    addMessage("I'm sorry, I couldn't process your request. Please try again.");
                }
            } catch (error) {
                console.error('Chatbot error:', error);
                removeLoadingMessage();
                addMessage("I'm having trouble connecting right now. Please try again in a moment.");
            } finally {
                isLoading = false;
            }
        }

        // Initialize chatbot
        document.addEventListener('DOMContentLoaded', function() {
            console.log('🤖 Gusto Italiano Chatbot Widget loaded');
        });
    </script>
</body>
</html>
EOF

# Step 2: Create the embeddable JavaScript widget
print_status "Creating embeddable JavaScript widget..."
cat > "$EXPORT_DIR/gusto-chatbot-widget.js" << 'EOF'
/**
 * Gusto Italiano Chatbot Widget
 * Embeddable chatbot for any website
 * 
 * Usage:
 * <script src="gusto-chatbot-widget.js"></script>
 * <script>
 *   GustoChatbot.init({
 *     apiUrl: 'https://your-api-domain.com/api/chat'
 *   });
 * </script>
 */

(function() {
    'use strict';

    const GustoChatbot = {
        config: {
            apiUrl: 'http://localhost:8080/api/chat',
            position: 'bottom-right',
            theme: 'green'
        },

        init: function(options = {}) {
            this.config = { ...this.config, ...options };
            this.injectStyles();
            this.createWidget();
            this.bindEvents();
            console.log('🤖 Gusto Italiano Chatbot initialized');
        },

        injectStyles: function() {
            const style = document.createElement('style');
            style.textContent = `
                /* Gusto Chatbot Widget Styles */
                .gusto-chatbot-widget {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    width: 350px;
                    height: 500px;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                    border: 1px solid #e5e7eb;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    z-index: 10000;
                    display: none;
                    flex-direction: column;
                }
                .gusto-chatbot-widget.open { display: flex; }
                .gusto-chatbot-header {
                    background: linear-gradient(135deg, #059669, #10b981);
                    color: white;
                    padding: 16px;
                    border-radius: 12px 12px 0 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .gusto-chatbot-title { font-weight: 600; font-size: 16px; }
                .gusto-chatbot-close {
                    background: none; border: none; color: white;
                    font-size: 20px; cursor: pointer; padding: 0;
                    width: 24px; height: 24px;
                    display: flex; align-items: center; justify-content: center;
                }
                .gusto-chatbot-messages {
                    flex: 1; padding: 16px; overflow-y: auto;
                    display: flex; flex-direction: column; gap: 12px;
                }
                .gusto-message {
                    max-width: 80%; padding: 12px 16px; border-radius: 18px;
                    font-size: 14px; line-height: 1.4;
                }
                .gusto-message.user {
                    background: #059669; color: white; align-self: flex-end;
                    border-bottom-right-radius: 4px;
                }
                .gusto-message.assistant {
                    background: #f3f4f6; color: #374151; align-self: flex-start;
                    border-bottom-left-radius: 4px;
                }
                .gusto-chatbot-input-area {
                    padding: 16px; border-top: 1px solid #e5e7eb;
                    display: flex; gap: 8px;
                }
                .gusto-chatbot-input {
                    flex: 1; padding: 12px 16px; border: 1px solid #d1d5db;
                    border-radius: 24px; outline: none; font-size: 14px;
                }
                .gusto-chatbot-input:focus { border-color: #059669; }
                .gusto-chatbot-send {
                    background: #059669; color: white; border: none;
                    border-radius: 50%; width: 40px; height: 40px;
                    cursor: pointer; display: flex; align-items: center; justify-content: center;
                }
                .gusto-chatbot-send:hover { background: #047857; }
                .gusto-chatbot-toggle {
                    position: fixed; bottom: 20px; right: 20px;
                    width: 60px; height: 60px;
                    background: linear-gradient(135deg, #059669, #10b981);
                    color: white; border: none; border-radius: 50%;
                    cursor: pointer; box-shadow: 0 4px 16px rgba(5, 150, 105, 0.3);
                    z-index: 10001; display: flex; align-items: center; justify-content: center;
                    font-size: 24px;
                }
                .gusto-chatbot-toggle:hover { transform: scale(1.05); }
                @media (max-width: 480px) {
                    .gusto-chatbot-widget {
                        width: calc(100vw - 40px); height: calc(100vh - 40px);
                        bottom: 20px; right: 20px; left: 20px;
                    }
                }
            `;
            document.head.appendChild(style);
        },

        createWidget: function() {
            const widget = document.createElement('div');
            widget.innerHTML = `
                <button class="gusto-chatbot-toggle" id="gustoToggle">💬</button>
                <div class="gusto-chatbot-widget" id="gustoChatbot">
                    <div class="gusto-chatbot-header">
                        <div class="gusto-chatbot-title">🇮🇹 Sofia - Gusto Italiano</div>
                        <button class="gusto-chatbot-close" id="gustoClose">×</button>
                    </div>
                    <div class="gusto-chatbot-messages" id="gustoMessages">
                        <div class="gusto-message assistant">
                            Ciao! 👋 I'm Sofia, your Italian food expert. Ask me about our wines, cheeses, or any questions about Gusto Italiano!
                        </div>
                    </div>
                    <div class="gusto-chatbot-input-area">
                        <input type="text" class="gusto-chatbot-input" id="gustoInput" 
                               placeholder="Ask me about Italian products...">
                        <button class="gusto-chatbot-send" id="gustoSend">➤</button>
                    </div>
                </div>
            `;
            document.body.appendChild(widget);
        },

        bindEvents: function() {
            const toggle = document.getElementById('gustoToggle');
            const close = document.getElementById('gustoClose');
            const send = document.getElementById('gustoSend');
            const input = document.getElementById('gustoInput');

            toggle.addEventListener('click', () => this.toggleWidget());
            close.addEventListener('click', () => this.toggleWidget());
            send.addEventListener('click', () => this.sendMessage());
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.sendMessage();
            });
        },

        toggleWidget: function() {
            const widget = document.getElementById('gustoChatbot');
            widget.classList.toggle('open');
            if (widget.classList.contains('open')) {
                document.getElementById('gustoInput').focus();
            }
        },

        addMessage: function(content, isUser = false) {
            const container = document.getElementById('gustoMessages');
            const message = document.createElement('div');
            message.className = `gusto-message ${isUser ? 'user' : 'assistant'}`;
            message.textContent = content;
            container.appendChild(message);
            container.scrollTop = container.scrollHeight;
        },

        sendMessage: async function() {
            const input = document.getElementById('gustoInput');
            const message = input.value.trim();
            if (!message) return;

            this.addMessage(message, true);
            input.value = '';

            try {
                const response = await fetch(this.config.apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        messages: [{ role: 'user', content: message }]
                    })
                });

                const data = await response.json();
                this.addMessage(data.response || "Sorry, I couldn't process that request.");
            } catch (error) {
                this.addMessage("I'm having trouble connecting. Please try again.");
            }
        }
    };

    // Auto-initialize if no manual config is provided
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (!window.GustoChatbotInitialized) {
                GustoChatbot.init();
            }
        });
    } else {
        if (!window.GustoChatbotInitialized) {
            GustoChatbot.init();
        }
    }

    // Expose to global scope
    window.GustoChatbot = GustoChatbot;
    window.GustoChatbotInitialized = true;
})();
EOF

# Step 3: Create integration examples
print_status "Creating integration examples..."

# HTML integration example
cat > "$EXPORT_DIR/integration-example.html" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Website with Gusto Italiano Chatbot</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f9fafb;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 { color: #059669; }
        .demo-content {
            line-height: 1.6;
            color: #374151;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🇮🇹 Welcome to Our Italian Food Store</h1>
        <div class="demo-content">
            <p>This is an example website with the Gusto Italiano chatbot integrated.</p>
            <p>Click the chat button in the bottom-right corner to start talking with Sofia, our AI assistant!</p>
            <p>She can help you with:</p>
            <ul>
                <li>🍷 Wine recommendations</li>
                <li>🧀 Cheese selections</li>
                <li>🍝 Product information</li>
                <li>❓ General questions about our store</li>
            </ul>
        </div>
    </div>

    <!-- Include the chatbot widget -->
    <script src="gusto-chatbot-widget.js"></script>
    <script>
        // Optional: Configure the chatbot
        GustoChatbot.init({
            apiUrl: 'https://your-api-domain.com/api/chat' // Update this URL
        });
    </script>
</body>
</html>
EOF

# Step 4: Create README for the export
print_status "Creating integration documentation..."
cat > "$EXPORT_DIR/README.md" << 'EOF'
# 🤖 Gusto Italiano Chatbot Widget

This package contains everything you need to integrate the Gusto Italiano chatbot into any website.

## 📁 Files Included

- `chatbot-widget.html` - Standalone chatbot page
- `gusto-chatbot-widget.js` - Embeddable JavaScript widget
- `integration-example.html` - Example integration
- `README.md` - This documentation

## 🚀 Quick Integration

### Method 1: JavaScript Widget (Recommended)

Add this to your website's HTML:

```html
<!-- Include the chatbot widget -->
<script src="gusto-chatbot-widget.js"></script>
<script>
    GustoChatbot.init({
        apiUrl: 'https://your-api-domain.com/api/chat'
    });
</script>
```

### Method 2: Iframe Embed

```html
<iframe 
    src="chatbot-widget.html" 
    width="350" 
    height="500"
    style="border: none; border-radius: 12px;">
</iframe>
```

## ⚙️ Configuration Options

```javascript
GustoChatbot.init({
    apiUrl: 'https://your-api-domain.com/api/chat',  // Required: Your API endpoint
    position: 'bottom-right',                        // Optional: Widget position
    theme: 'green'                                   // Optional: Color theme
});
```

## 🔧 Setup Requirements

1. **Update API URL**: Replace `http://localhost:8080/api/chat` with your production API URL
2. **CORS Configuration**: Ensure your API allows requests from the target domain
3. **HTTPS**: Use HTTPS for production deployments

## 🎨 Customization

The widget uses CSS custom properties for easy theming:

```css
.gusto-chatbot-widget {
    --primary-color: #059669;
    --secondary-color: #10b981;
    --text-color: #374151;
    --background-color: white;
}
```

## 📱 Features

- ✅ Responsive design (mobile-friendly)
- ✅ Smooth animations
- ✅ Loading indicators
- ✅ Error handling
- ✅ Keyboard navigation
- ✅ Accessibility support

## 🔒 Security Notes

- The widget only sends user messages to your API
- No sensitive data is stored in the browser
- All communication should use HTTPS in production

## 🐛 Troubleshooting

### Common Issues

1. **Chatbot not appearing**: Check browser console for JavaScript errors
2. **API errors**: Verify the API URL and CORS settings
3. **Styling conflicts**: The widget uses prefixed CSS classes to avoid conflicts

### Debug Mode

Enable debug logging:

```javascript
GustoChatbot.init({
    apiUrl: 'your-api-url',
    debug: true
});
```

## 📞 Support

For technical support or customization requests, please contact the development team.

---

**Made with ❤️ by the Gusto Italiano team**
EOF

# Step 5: Create deployment script
print_status "Creating deployment helper script..."
cat > "$EXPORT_DIR/deploy.sh" << 'EOF'
#!/bin/bash

# 🚀 Gusto Italiano Chatbot - Deployment Helper
# This script helps deploy the chatbot widget to a web server

echo "🚀 Deploying Gusto Italiano Chatbot Widget..."

# Configuration
REMOTE_SERVER=""
REMOTE_PATH=""
API_URL=""

# Check if configuration is provided
if [ -z "$REMOTE_SERVER" ] || [ -z "$REMOTE_PATH" ] || [ -z "$API_URL" ]; then
    echo "⚠️  Please configure the deployment settings in this script:"
    echo "   REMOTE_SERVER: Your web server address"
    echo "   REMOTE_PATH: Path on the server where files should be uploaded"
    echo "   API_URL: Your production API URL"
    exit 1
fi

# Update API URL in the widget
echo "📝 Updating API URL to: $API_URL"
sed -i.bak "s|http://localhost:8080/api/chat|$API_URL|g" gusto-chatbot-widget.js
sed -i.bak "s|http://localhost:8080/api/chat|$API_URL|g" chatbot-widget.html

# Upload files
echo "📤 Uploading files to $REMOTE_SERVER:$REMOTE_PATH"
scp *.html *.js *.md "$REMOTE_SERVER:$REMOTE_PATH/"

echo "✅ Deployment complete!"
echo "🌐 Your chatbot widget is now available at: https://$REMOTE_SERVER$REMOTE_PATH/"
EOF

chmod +x "$EXPORT_DIR/deploy.sh"

# Step 6: Create package info
print_status "Creating package information..."
cat > "$EXPORT_DIR/package.json" << 'EOF'
{
  "name": "gusto-italiano-chatbot-widget",
  "version": "1.0.0",
  "description": "Embeddable chatbot widget for Gusto Italiano",
  "main": "gusto-chatbot-widget.js",
  "files": [
    "gusto-chatbot-widget.js",
    "chatbot-widget.html",
    "integration-example.html",
    "README.md"
  ],
  "keywords": [
    "chatbot",
    "widget",
    "italian-food",
    "ai-assistant",
    "embeddable"
  ],
  "author": "Gusto Italiano Team",
  "license": "MIT"
}
EOF

print_success "✅ Chatbot widget export completed!"
print_status ""
print_status "📦 Export created in: $EXPORT_DIR/"
print_status ""
print_status "📁 Files created:"
print_status "  • chatbot-widget.html - Standalone chatbot page"
print_status "  • gusto-chatbot-widget.js - Embeddable JavaScript widget"
print_status "  • integration-example.html - Integration example"
print_status "  • README.md - Documentation"
print_status "  • deploy.sh - Deployment helper"
print_status "  • package.json - Package information"
print_status ""
print_status "🚀 Next steps:"
print_status "  1. Update the API URL in the widget files"
print_status "  2. Test the integration with integration-example.html"
print_status "  3. Deploy to your web server"
print_status "  4. Configure CORS on your API server"
print_status ""
print_success "🎉 Your chatbot is ready for integration!" 