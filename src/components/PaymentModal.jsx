import { useState } from 'react'
import './PaymentModal.css'

function PaymentModal({ onClose }) {
  const [isClosing, setIsClosing] = useState(false)
  const buyMeCoffeeUrl = 'https://buymeacoffee.com/frankyredente'

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
    }, 200)
  }

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className={`modal-content ${isClosing ? 'modal-closing' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <h2>Support This Project</h2>
          <p className="modal-subtitle">
            Thanks for using A/B This! This tool is free but development and server costs add up.
            If you find it valuable, consider supporting with a small tip.
          </p>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Payment Options */}
          <div className="payment-options">
            <p className="options-label">Choose your support level:</p>

            <a
              href={`${buyMeCoffeeUrl}?amount=1`}
              target="_blank"
              rel="noopener noreferrer"
              className="payment-option option-yellow"
            >
              <div className="option-content">
                <div className="option-left">
                  <span className="option-icon">☕</span>
                  <div>
                    <p className="option-title">Buy me a coffee</p>
                    <p className="option-desc">Small but appreciated</p>
                  </div>
                </div>
                <span className="option-price">$1</span>
              </div>
            </a>

            <a
              href={`${buyMeCoffeeUrl}?amount=3`}
              target="_blank"
              rel="noopener noreferrer"
              className="payment-option option-orange"
            >
              <div className="option-content">
                <div className="option-left">
                  <span className="option-icon">🍕</span>
                  <div>
                    <p className="option-title">Buy me lunch</p>
                    <p className="option-desc">Really helps out</p>
                  </div>
                </div>
                <span className="option-price">$3</span>
              </div>
            </a>

            <a
              href={`${buyMeCoffeeUrl}?amount=5`}
              target="_blank"
              rel="noopener noreferrer"
              className="payment-option option-green"
            >
              <div className="option-content">
                <div className="option-left">
                  <span className="option-icon">🎉</span>
                  <div>
                    <p className="option-title">Super supporter</p>
                    <p className="option-desc">You're amazing!</p>
                  </div>
                </div>
                <span className="option-price">$5</span>
              </div>
            </a>

            <a
              href={buyMeCoffeeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="payment-option option-purple"
            >
              <div className="option-content">
                <div className="option-left">
                  <span className="option-icon">💝</span>
                  <div>
                    <p className="option-title">Custom amount</p>
                    <p className="option-desc">Choose your own amount</p>
                  </div>
                </div>
                <span className="option-price">$$$</span>
              </div>
            </a>
          </div>

          {/* Close Button */}
          <div className="modal-actions">
            <button
              onClick={handleClose}
              className="btn-close-modal"
            >
              Close
            </button>
          </div>

          {/* Footer Message */}
          <div className="modal-footer">
            <p>Your contribution helps keep this tool free for everyone. Thank you!</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PaymentModal
