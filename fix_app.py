#!/usr/bin/env python
"""
Quick fix script to remove SQLAlchemy references from app.py
"""

import re

# Read the file
with open('app.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the error handler that uses db.session
content = re.sub(
    r'@app\.errorhandler\(500\)\s+def internal_error\(error\):\s+db\.session\.rollback\(\)',
    '@app.errorhandler(500)\ndef internal_error(error):',
    content
)

# Comment out problematic endpoints that use SQLAlchemy
# These will be replaced with MongoDB versions

# Fix history endpoint
history_old = r'''@app\.route\('/api/history', methods=\['GET'\]\)
def get_history\(\):
    """Get prediction history"""
    try:
        page = request\.args\.get\('page', 1, type=int\)
        per_page = request\.args\.get\('per_page', 20, type=int\)
        
        predictions = Prediction\.query\.order_by\(
            Prediction\.timestamp\.desc\(\)
        \)\.paginate\(page=page, per_page=per_page, error_out=False\)'''

history_new = '''@app.route('/api/history', methods=['GET'])
def get_history():
    """Get prediction history from MongoDB"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        if mongo_db:
            skip = (page - 1) * per_page
            predictions = list(mongo_db.predictions.find().sort('timestamp', -1).skip(skip).limit(per_page))
            total = mongo_db.predictions.count_documents({})
            
            for pred in predictions:
                pred['_id'] = str(pred['_id'])
                if 'timestamp' in pred and hasattr(pred['timestamp'], 'isoformat'):
                    pred['timestamp'] = pred['timestamp'].isoformat()
            
            return jsonify({
                'predictions': predictions,
                'page': page,
                'per_page': per_page,
                'total': total
            }), 200
        else:
            return jsonify({'predictions': [], 'total': 0}), 200'''

content = re.sub(history_old, history_new, content, flags=re.DOTALL)

# Write back
with open('app.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Fixed app.py - removed SQLAlchemy references")
