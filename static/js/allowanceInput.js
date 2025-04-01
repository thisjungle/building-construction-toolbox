// Process form inputs and update state
class AllowanceInput {
    constructor(allowanceState) {
        this.state = allowanceState;
    }

    processFormInput(input) {
        const name = input.name;
        const value = parseFloat(input.value);
        const optionContent = input.closest('.option-content');
        const title = optionContent.querySelector('.option-title').textContent;
        const hintElement = optionContent.querySelector('.hint');
        const hint = hintElement ? hintElement.textContent : '';
        const period = optionContent.getAttribute('data-period');

        return { name, value, title, hint, period };
    }

    updateStateFromInput(input) {
        const { name, value, title, hint, period } = this.processFormInput(input);
        const weeklyValue = this.state.calculateWeeklyValue(value, period);

        if (name.startsWith('industry')) {
            this.state.state.allowances.industry = { title, value, hint, period };
            this.state.state.total += weeklyValue;
        } else if (name.startsWith('tools')) {
            this.state.state.allowances.tools = { title, value, hint, period };
            if (title !== 'None') {
                this.state.state.total += weeklyValue;
            }
        } else if (name.startsWith('first_aid')) {
            this.state.state.allowances.firstAid = { title, value, hint, period };
            if (title !== 'None') {
                this.state.state.total += weeklyValue;
            }
        } else if (name.startsWith('other')) {
            this.state.state.allowances.other.push({ title, value, hint, period });
            this.state.state.total += weeklyValue;
        }
    }

    resetState() {
        this.state.state.allowances = {
            industry: {},
            tools: {},
            firstAid: {},
            other: []
        };
        this.state.state.total = 0;
    }

    processAllInputs() {
        const form = document.getElementById('allowancesForm');
        if (!form) return;

        this.resetState();
        form.querySelectorAll('input[type="radio"]:checked, input[type="checkbox"]:checked')
            .forEach(input => this.updateStateFromInput(input));
    }
} 