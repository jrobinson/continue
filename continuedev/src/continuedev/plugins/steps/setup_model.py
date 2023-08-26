from ...core.main import Step
from ...core.sdk import ContinueSDK
from ...libs.util.paths import getConfigFilePath

MODEL_CLASS_TO_MESSAGE = {
    "OpenAI": "Obtain your OpenAI API key from [here](https://platform.openai.com/account/api-keys) and paste it into the `api_key` field at config.models.default.api_key in `config.py`. Then reload the VS Code window for changes to take effect.",
    "MaybeProxyOpenAI": "To get started with OpenAI models, obtain your OpenAI API key from [here](https://platform.openai.com/account/api-keys) and paste it into the `api_key` field at config.models.default.api_key in `config.py`. Then reload the VS Code window for changes to take effect.",
    "AnthropicLLM": "To get started with Anthropic, you first need to sign up for the beta [here](https://claude.ai/login) to obtain an API key. Once you have the key, paste it into the `api_key` field at config.models.default.api_key in `config.py`. Then reload the VS Code window for changes to take effect.",
    "ReplicateLLM": "To get started with Replicate, sign up to obtain an API key [here](https://replicate.ai/), then paste it into the `api_key` field at config.models.default.api_key in `config.py`.",
    "Ollama": "To get started with Ollama, download the Mac app from [ollama.ai](https://ollama.ai/). Once it is downloaded, be sure to pull at least one model and use its name in the model field in config.py (e.g. `model='codellama'`).",
    "GGML": "GGML models can be run locally using the `llama-cpp-python` library. To learn how to set up a local llama-cpp-python server, read [here](https://github.com/continuedev/ggml-server-example). Once it is started on port 8000, you're all set!",
    "TogetherLLM": "To get started using models from Together, first obtain your Together API key from [here](https://together.ai). Paste it into the `api_key` field at config.models.default.api_key in `config.py`. Then, on their models page, press 'start' on the model of your choice and make sure the `model=` parameter in the config file for the `TogetherLLM` class reflects the name of this model. Finally, reload the VS Code window for changes to take effect.",
}


class SetupModelStep(Step):
    model_class: str
    name: str = "Setup model in config.py"

    async def run(self, sdk: ContinueSDK):
        await sdk.ide.setFileOpen(getConfigFilePath())
        self.description = MODEL_CLASS_TO_MESSAGE.get(
            self.model_class, "Please finish setting up this model in `config.py`"
        )