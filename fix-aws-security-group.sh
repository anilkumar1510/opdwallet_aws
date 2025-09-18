#!/bin/bash

# Script to fix AWS Security Group for EC2 instance
# This will ensure ports 22, 80, and 443 are open

echo "🔧 AWS Security Group Fix Instructions"
echo "======================================"
echo ""
echo "The server at 51.20.125.246 is not accessible. This is likely due to Security Group settings."
echo ""
echo "To fix this issue, follow these steps in AWS Console:"
echo ""
echo "1. Go to AWS EC2 Console: https://console.aws.amazon.com/ec2/"
echo ""
echo "2. Find your instance (IP: 51.20.125.246) and click on it"
echo ""
echo "3. In the 'Security' tab, click on the Security Group link"
echo ""
echo "4. Click 'Edit inbound rules' and ensure these rules exist:"
echo "   ┌─────────┬──────────┬───────────┬─────────────┐"
echo "   │ Type    │ Protocol │ Port      │ Source      │"
echo "   ├─────────┼──────────┼───────────┼─────────────┤"
echo "   │ SSH     │ TCP      │ 22        │ 0.0.0.0/0   │"
echo "   │ HTTP    │ TCP      │ 80        │ 0.0.0.0/0   │"
echo "   │ HTTPS   │ TCP      │ 443       │ 0.0.0.0/0   │"
echo "   └─────────┴──────────┴───────────┴─────────────┘"
echo ""
echo "5. If using AWS CLI, you can run these commands:"
echo ""

# Get the instance ID first
echo "# First, get your instance ID:"
echo "aws ec2 describe-instances --filters \"Name=ip-address,Values=51.20.125.246\" --query 'Reservations[0].Instances[0].InstanceId' --output text"
echo ""

echo "# Then get the Security Group ID:"
echo "INSTANCE_ID=\$(aws ec2 describe-instances --filters \"Name=ip-address,Values=51.20.125.246\" --query 'Reservations[0].Instances[0].InstanceId' --output text)"
echo "SG_ID=\$(aws ec2 describe-instances --instance-ids \$INSTANCE_ID --query 'Reservations[0].Instances[0].SecurityGroups[0].GroupId' --output text)"
echo ""

echo "# Add the required rules:"
echo "aws ec2 authorize-security-group-ingress --group-id \$SG_ID --protocol tcp --port 22 --cidr 0.0.0.0/0"
echo "aws ec2 authorize-security-group-ingress --group-id \$SG_ID --protocol tcp --port 80 --cidr 0.0.0.0/0"
echo "aws ec2 authorize-security-group-ingress --group-id \$SG_ID --protocol tcp --port 443 --cidr 0.0.0.0/0"
echo ""

echo "6. Alternative: Check if the instance is running:"
echo "   - Go to EC2 Console"
echo "   - Check instance state (should be 'running')"
echo "   - If stopped, click 'Instance State' → 'Start Instance'"
echo ""

echo "7. If SSH is disabled on the server itself:"
echo "   - You may need to use AWS Systems Manager Session Manager"
echo "   - Or use EC2 Instance Connect if configured"
echo "   - Or reboot the instance from AWS Console"
echo ""

echo "Once you've fixed the Security Group, test connection:"
echo "ssh -i opdwallet-server.pem ubuntu@51.20.125.246"
echo ""
echo "Then run the deployment:"
echo "./deploy-production.sh"