const { Pool } = require('pg');

class ChatbotService {
  constructor(pool) {
    this.pool = pool;
  }

  async processMessage(message, userId = null) {
    const lowerMessage = message.toLowerCase();
    
    // Bills related queries
    if (this.containsAny(lowerMessage, ['bill', 'bills', 'due', 'payment'])) {
      return await this.handleBillsQuery(lowerMessage);
    }
    
    // Credit card related queries
    if (this.containsAny(lowerMessage, ['credit card', 'card', 'credit', 'due amount', 'payment'])) {
      return await this.handleCreditCardQuery(lowerMessage);
    }
    
    // Payment instructions
    if (this.containsAny(lowerMessage, ['how to pay', 'pay bill', 'payment method', 'pay card'])) {
      return await this.handlePaymentQuery(lowerMessage);
    }
    
    // Reminders and due dates
    if (this.containsAny(lowerMessage, ['reminder', 'due date', 'overdue', 'when due'])) {
      return await this.handleReminderQuery(lowerMessage);
    }
    
    // Analytics and summaries
    if (this.containsAny(lowerMessage, ['analytics', 'summary', 'total', 'spending', 'month'])) {
      return await this.handleAnalyticsQuery(lowerMessage);
    }
    
    // Help and navigation
    if (this.containsAny(lowerMessage, ['help', 'what can you do', 'assist', 'support'])) {
      return this.handleHelpQuery();
    }
    
    // Navigation
    if (this.containsAny(lowerMessage, ['dashboard', 'bills page', 'credit cards', 'go to'])) {
      return this.handleNavigationQuery(lowerMessage);
    }
    
    // FAQs
    if (this.containsAny(lowerMessage, ['add bill', 'add card', 'delete', 'remove', 'how to'])) {
      return this.handleFAQQuery(lowerMessage);
    }
    
    // Default response
    return {
      type: 'text',
      content: "I'm not sure I understand. Try asking about your bills, credit cards, payments, or type 'help' to see what I can do.",
      quickReplies: [
        { text: "Show my bills", query: "Show my bills" },
        { text: "Credit card info", query: "Credit card info" },
        { text: "How to pay", query: "How to pay" },
        { text: "Help me", query: "Help me" }
      ]
    };
  }

  async handleBillsQuery(message) {
    try {
      const result = await this.pool.query(`
        SELECT name, amount, due_date, status 
        FROM bills 
        WHERE status = 'Unpaid' 
        ORDER BY due_date ASC 
        LIMIT 5
      `);
      
      if (result.rows.length === 0) {
        return {
          type: 'text',
          content: "Great news! You don't have any pending bills at the moment.",
          quickReplies: [
            { text: "Add a bill", query: "How to add a bill" },
            { text: "Credit card info", query: "Credit card info" },
            { text: "Analytics", query: "Show analytics" }
          ]
        };
      }
      
      let content = "Here are your upcoming/pending bills:\n\n";
      result.rows.forEach((bill, index) => {
        const dueDate = new Date(bill.due_date).toLocaleDateString();
        const daysUntilDue = Math.ceil((new Date(bill.due_date) - new Date()) / (1000 * 60 * 60 * 24));
        const status = daysUntilDue < 0 ? "OVERDUE" : daysUntilDue === 0 ? "Due today" : `Due in ${daysUntilDue} days`;
        
        content += `${index + 1}. ${bill.name} - ₹${bill.amount} (${status})\n`;
      });
      
      return {
        type: 'text',
        content: content,
        quickReplies: [
          { text: "How to pay", query: "How to pay" },
          { text: "Add bill", query: "How to add a bill" },
          { text: "View all bills", query: "Show all bills" }
        ]
      };
    } catch (error) {
      console.error('Error fetching bills:', error);
      return {
        type: 'text',
        content: "Sorry, I couldn't fetch your bills right now. Please try again later."
      };
    }
  }

  async handleCreditCardQuery(message) {
    try {
      const result = await this.pool.query(`
        SELECT card_company, card_number, card_holder, expiry_month, expiry_year 
        FROM credit_cards 
        ORDER BY created_at DESC 
        LIMIT 3
      `);
      
      if (result.rows.length === 0) {
        return {
          type: 'text',
          content: "You don't have any credit cards added yet. Would you like to add one?",
          quickReplies: [
            { text: "Add credit card", query: "How to add a credit card" },
            { text: "View bills", query: "Show my bills" },
            { text: "Help", query: "Help me" }
          ]
        };
      }
      
      let content = "Here are your credit cards:\n\n";
      result.rows.forEach((card, index) => {
        const maskedNumber = card.card_number.replace(/\d(?=\d{4})/g, '*');
        content += `${index + 1}. ${card.card_company} - ${maskedNumber}\n`;
        content += `   Holder: ${card.card_holder}\n`;
        content += `   Expires: ${card.expiry_month}/${card.expiry_year}\n\n`;
      });
      
      return {
        type: 'text',
        content: content,
        quickReplies: [
          { text: "View statements", query: "How to view statements" },
          { text: "Add another card", query: "How to add a credit card" },
          { text: "Smart insights", query: "Show analytics" }
        ]
      };
    } catch (error) {
      console.error('Error fetching credit cards:', error);
      return {
        type: 'text',
        content: "Sorry, I couldn't fetch your credit card information right now."
      };
    }
  }

  handlePaymentQuery(message) {
    const content = `Here's how to make payments:\n\n` +
      `📱 **For Bills:**\n` +
      `• Go to Bills page\n` +
      `• Find the bill you want to pay\n` +
      `• Click "Pay" button\n` +
      `• Choose payment method (UPI, Card, Net Banking)\n\n` +
      `💳 **For Credit Cards:**\n` +
      `• Go to Credit Cards → Manage Cards\n` +
      `• Select your card\n` +
      `• Click "Pay Bill"\n` +
      `• Enter amount and payment method\n\n` +
      `💡 **Payment Methods Available:**\n` +
      `• UPI (Google Pay, PhonePe, Paytm)\n` +
      `• Credit/Debit Cards\n` +
      `• Net Banking\n` +
      `• NEFT/RTGS`;

    return {
      type: 'text',
      content: content,
      quickReplies: [
        { text: "Show my bills", query: "Show my bills" },
        { text: "Credit card info", query: "Credit card info" },
        { text: "Go to bills page", query: "Go to bills page" }
      ]
    };
  }

  async handleReminderQuery(message) {
    try {
      const result = await this.pool.query(`
        SELECT name, due_date, amount 
        FROM bills 
        WHERE status = 'Unpaid' 
        ORDER BY due_date ASC 
        LIMIT 3
      `);
      
      if (result.rows.length === 0) {
        return {
          type: 'text',
          content: "You're all caught up! No bills are due soon.",
          quickReplies: [
            { text: "Add a bill", query: "How to add a bill" },
            { text: "View analytics", query: "Show analytics" },
            { text: "Help", query: "Help me" }
          ]
        };
      }
      
      let content = "📅 **Upcoming Due Dates:**\n\n";
      result.rows.forEach((bill, index) => {
        const dueDate = new Date(bill.due_date).toLocaleDateString();
        const daysUntilDue = Math.ceil((new Date(bill.due_date) - new Date()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilDue < 0) {
          content += `🚨 **${bill.name}** - ₹${bill.amount} (OVERDUE by ${Math.abs(daysUntilDue)} days)\n`;
        } else if (daysUntilDue === 0) {
          content += `⚠️ **${bill.name}** - ₹${bill.amount} (Due TODAY)\n`;
        } else if (daysUntilDue <= 3) {
          content += `🔔 **${bill.name}** - ₹${bill.amount} (Due in ${daysUntilDue} days)\n`;
        } else {
          content += `📋 **${bill.name}** - ₹${bill.amount} (Due on ${dueDate})\n`;
        }
      });
      
      return {
        type: 'text',
        content: content,
        quickReplies: [
          { text: "Pay now", query: "How to pay" },
          { text: "View all bills", query: "Show my bills" },
          { text: "Set reminder", query: "How to set reminder" }
        ]
      };
    } catch (error) {
      console.error('Error fetching reminders:', error);
      return {
        type: 'text',
        content: "Sorry, I couldn't fetch your reminders right now."
      };
    }
  }

  async handleAnalyticsQuery(message) {
    try {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      
      // Get bills summary
      const billsResult = await this.pool.query(`
        SELECT 
          COUNT(*) as total_bills,
          SUM(CASE WHEN status = 'Unpaid' THEN 1 ELSE 0 END) as unpaid_bills,
          SUM(CASE WHEN status = 'Paid' THEN 1 ELSE 0 END) as paid_bills,
          SUM(amount) as total_amount
        FROM bills
      `);
      
      // Get spending by category
      const spendingResult = await this.pool.query(`
        SELECT category, SUM(amount) as total
        FROM transactions 
        WHERE type = 'Debit' 
        AND EXTRACT(MONTH FROM date) = $1 
        AND EXTRACT(YEAR FROM date) = $2
        GROUP BY category 
        ORDER BY total DESC 
        LIMIT 5
      `, [currentMonth, currentYear]);
      
      const bills = billsResult.rows[0];
      let content = `📊 **This Month's Summary:**\n\n`;
      content += `💰 **Bills Overview:**\n`;
      content += `• Total Bills: ${bills.total_bills}\n`;
      content += `• Paid: ${bills.paid_bills}\n`;
      content += `• Pending: ${bills.unpaid_bills}\n`;
      content += `• Total Amount: ₹${bills.total_amount || 0}\n\n`;
      
      if (spendingResult.rows.length > 0) {
        content += `💳 **Top Spending Categories:**\n`;
        spendingResult.rows.forEach((item, index) => {
          content += `${index + 1}. ${item.category}: ₹${item.total}\n`;
        });
      }
      
      return {
        type: 'text',
        content: content,
        quickReplies: [
          { text: "View detailed insights", query: "Go to smart insights" },
          { text: "Show bills", query: "Show my bills" },
          { text: "Credit card info", query: "Credit card info" }
        ]
      };
    } catch (error) {
      console.error('Error fetching analytics:', error);
      return {
        type: 'text',
        content: "Sorry, I couldn't fetch your analytics right now."
      };
    }
  }

  handleHelpQuery() {
    const content = `🤖 **I can help you with:**\n\n` +
      `Choose a category below to get started:`;

    return {
      type: 'text',
      content: content,
      quickReplies: [
        { text: "📋 Bills Management", query: "Show my bills" },
        { text: "💳 Credit Cards", query: "Credit card info" },
        { text: "📊 Analytics", query: "Show analytics" },
        { text: "🧭 Navigation", query: "Go to bills page" },
        { text: "❓ FAQs", query: "How to add a bill" },
        { text: "💳 Payment Help", query: "How to pay" }
      ]
    };
  }

  handleNavigationQuery(message) {
    const content = `🧭 **Quick Navigation:**\n\n` +
      `🏠 **Dashboard:** Overview of your finances\n` +
      `📋 **Bills:** Manage and pay your bills\n` +
      `💳 **Credit Cards:** Add and manage cards\n` +
      `📊 **Smart Insights:** View spending analytics\n` +
      `📄 **Statements:** Check transaction history\n` +
      `❓ **Help & Support:** Get assistance\n\n` +
      `Click on any section in the navigation menu above!`;

    return {
      type: 'text',
      content: content,
      quickReplies: [
        { text: "Go to bills", query: "Go to bills page" },
        { text: "Go to credit cards", query: "Go to credit cards" },
        { text: "Go to insights", query: "Go to smart insights" },
        { text: "Show my bills", query: "Show my bills" }
      ]
    };
  }

  handleFAQQuery(message) {
    const faqs = {
      'add bill': {
        content: `📝 **How to Add a Bill:**\n\n` +
          `1. Go to the Bills page\n` +
          `2. Click "Add Bill" button\n` +
          `3. Fill in the details:\n` +
          `   • Bill name\n` +
          `   • Amount\n` +
          `   • Due date\n` +
          `   • Category\n` +
          `4. Click "Save"\n\n` +
          `The bill will be added to your list and you'll get reminders!`,
        quickReplies: [
          { text: "Go to bills page", query: "Go to bills page" },
          { text: "Show my bills", query: "Show my bills" },
          { text: "Payment help", query: "How to pay" }
        ]
      },
      'add card': {
        content: `💳 **How to Add a Credit Card:**\n\n` +
          `1. Go to Credit Cards → Add Card\n` +
          `2. Fill in card details:\n` +
          `   • Card company (Visa/Mastercard/Rupay)\n` +
          `   • Card number\n` +
          `   • Card holder name\n` +
          `   • Expiry date\n` +
          `   • CVV\n` +
          `3. Click "Add Card"\n\n` +
          `Your card will be securely stored!`,
        quickReplies: [
          { text: "Go to add card", query: "Go to add card" },
          { text: "View my cards", query: "Credit card info" },
          { text: "Help", query: "Help me" }
        ]
      },
      'delete': {
        content: `🗑️ **How to Delete Bills/Cards:**\n\n` +
          `**For Bills:**\n` +
          `• Go to Bills page\n` +
          `• Find the bill\n` +
          `• Click "Delete" button\n\n` +
          `**For Credit Cards:**\n` +
          `• Go to Credit Cards → Manage Cards\n` +
          `• Find your card\n` +
          `• Click "Delete" button\n\n` +
          `⚠️ **Note:** This action cannot be undone!`,
        quickReplies: [
          { text: "Show my bills", query: "Show my bills" },
          { text: "Credit card info", query: "Credit card info" },
          { text: "Help", query: "Help me" }
        ]
      }
    };

    for (const [key, value] of Object.entries(faqs)) {
      if (message.includes(key)) {
        return {
          type: 'text',
          content: value.content,
          quickReplies: value.quickReplies
        };
      }
    }

    return {
      type: 'text',
      content: "I can help you with:\n• How to add bills\n• How to add credit cards\n• How to delete items\n\nWhat would you like to know?",
      quickReplies: [
        { text: "Add bill", query: "How to add a bill" },
        { text: "Add card", query: "How to add a credit card" },
        { text: "Delete items", query: "How to delete" },
        { text: "Help", query: "Help me" }
      ]
    };
  }

  containsAny(message, keywords) {
    return keywords.some(keyword => message.includes(keyword));
  }
}

module.exports = ChatbotService; 