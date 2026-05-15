import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import * as path from 'path';

export class QuestionGeneratorApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const questionLambda = new NodejsFunction(this, 'GenerateQuestionsLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, '../src/function/handler.ts'),
      timeout: cdk.Duration.minutes(2),
      memorySize: 512,
      bundling: {
        minify: true,
        target: 'node20',
        externalModules: ['aws-sdk'],
      },
    });

    questionLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['bedrock:*'],
      resources: ['*'],
    }));

    const api = new apigateway.RestApi(this, 'QuestionsApi', {
      restApiName: 'Generate Interview Questions API',
      defaultCorsPreflightOptions: {
        allowOrigins: ['*'],
        allowMethods: ['OPTIONS', 'POST'],
        allowHeaders: ['Content-Type'],
      },
    });

    api.root
      .addResource('quesgen')
      .addMethod('POST', new apigateway.LambdaIntegration(questionLambda));

    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      description: 'API Gateway endpoint URL'
    });
  }
}