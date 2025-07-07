import { postGithubWebhook } from '../../api/webhooks';

export default function WebhookTest() {
  const handleTestWebhook = async () => {
    const res = await postGithubWebhook({
      additionalProp1: ['test'],
      additionalProp2: ['test2'],
      additionalProp3: ['test3'],
    });
    alert(JSON.stringify(res));
  };

  return (
    <button onClick={handleTestWebhook}>Test GitHub Webhook</button>
  );
} 