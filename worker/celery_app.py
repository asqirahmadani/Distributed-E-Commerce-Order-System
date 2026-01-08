from sendgrid.helpers.mail import Mail, Email, To, Content # type: ignore
from sendgrid import SendGridAPIClient # type: ignore
from celery import Celery # type: ignore
import time
import logging
import os

# configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# initialize celery
celery_app = Celery(
    'order_tasks',
    broker=os.getenv('CELERY_BROKER_URL', 'redis://redis:6379/0'),
    backend=os.getenv('CELERY_RESULT_BACKEND', 'redis://redis:6379/1')
)

# celery configuration
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,  # 5 minutes
    task_soft_time_limit=240,  # 4 minutes
    worker_prefetch_multiplier=4,
    worker_max_tasks_per_child=1000,
)

@celery_app.task(name='tasks.process_order', bind=True, max_retries=3)
def process_order(self, **kwargs):
    """
    Process order after creation
    Simulates external API call with 5s delay
    
    Args:
        **kwargs: Order data as keyword arguments
            - id: Order UUID
            - productName: Product name
            - quantity: Order quantity
            - totalPrice: Total price
            - customerEmail: Customer email (optional)
        
    Returns:
        Dictionary with processing result
    """
    try:
        order_id = kwargs.get('id')
        product_name = kwargs.get('productName')
        quantity = kwargs.get('quantity')
        total_price = kwargs.get('totalPrice')
        
        logger.info(f"Starting to process Order #{order_id}")
        logger.info(f"Order details - Product: {product_name}, Quantity: {quantity}, Total: ${total_price}")
        
        # Simulate external API call (payment gateway, inventory sync, etc.)
        logger.info(f"Simulating external API call for Order #{order_id}...")
        time.sleep(5)  # 5 second delay
        
        # Simulate processing logic
        processing_result = {
            'order_id': order_id,
            'status': 'processed',
            'timestamp': time.time(),
            'message': f'Order #{order_id} has been successfully processed'
        }
        
        logger.info(f"Order #{order_id} Processed ✓")
        
        return processing_result
        
    except Exception as exc:
        logger.error(f"Error processing Order #{order_id}: {str(exc)}")
        
        # Retry with exponential backoff
        raise self.retry(exc=exc, countdown=2 ** self.request.retries)


@celery_app.task(name='tasks.send_order_notification', bind=True, max_retries=3)
def send_order_notification(self, **kwargs):
    """
    Send notification email/SMS after order creation
    
    Args:
        **kwargs: Order data as keyword arguments
            - id: Order UUID
            - customerEmail: Customer email
    """
    try:
        order_id = kwargs.get('id')
        customer_email = kwargs.get('customerEmail', 'N/A')
        
        logger.info(f"Sending notification for Order #{order_id} to {customer_email}")
        
        # Simulate email/SMS sending
        time.sleep(2)
        
        logger.info(f"Notification sent successfully for Order #{order_id}")
        
        return {
            'order_id': order_id,
            'notification_sent': True,
            'recipient': customer_email
        }
        
    except Exception as exc:
        logger.error(f"Error sending notification for Order #{order_id}: {str(exc)}")
        raise self.retry(exc=exc, countdown=2 ** self.request.retries)


@celery_app.task(name='tasks.update_inventory_analytics', bind=True)
def update_inventory_analytics(self, **kwargs):
    """
    Update inventory analytics and metrics
    
    Args:
        **kwargs: Analytics data
            - product_id: Product UUID
            - quantity_sold: Quantity sold
    """
    try:
        product_id = kwargs.get('product_id')
        quantity_sold = kwargs.get('quantity_sold')

        logger.info(f"Updating analytics for Product {product_id}, Quantity sold: {quantity_sold}")
        
        # Simulate analytics update
        time.sleep(1)
        
        logger.info(f"Analytics updated for Product {product_id}")
        
        return {
            'product_id': product_id,
            'quantity_sold': quantity_sold,
            'updated': True
        }
        
    except Exception as exc:
        logger.error(f"Error updating analytics: {str(exc)}")
        raise

if __name__ == '__main__':
    celery_app.start()