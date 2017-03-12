export class ComponentAnalyses {

    private stackApiUrl: string;

    constructor() {
        this.stackApiUrl = 'http://bayesian-api-bayesian-staging.b6ff.rh-idev.openshiftapps.com/api/v1/';
    }

    buildComponentGrid = (dataSet: Array<any>) => {
        for (var i in dataSet) {
            console.log(i);
            var strToAdd = '<tr>' +
                '<td>' + dataSet[i].gh_issues_closed_last_month + '</td>' +
                '<td>' + dataSet[i].gh_issues_closed_last_year + '</td>' +
                '<td>' + dataSet[i].gh_issues_opened_last_month + '<td>' +
                '<td>' + dataSet[i].gh_issues_opened_last_year + '<td>' +
                '<td>' + dataSet[i].gh_prs_closed_last_month + '</td>' +
                '<td>' + dataSet[i].gh_prs_closed_last_year + '</td>' +
                '<td>' + dataSet[i].gh_prs_opened_last_month + '<td>' +
                '<td>' + dataSet[i].gh_prs_opened_last_year + '<td></tr>';
            $('#compTable').append(strToAdd);
        }
    }

    formStackData = (compAnalysesArray: any) => {
        if (compAnalysesArray.length) {
            let dataSet: Array<any> = [];
            for (let i in compAnalysesArray) {
                console.log(compAnalysesArray[i].package)
                dataSet.push(compAnalysesArray[i].package.gh_issues_closed_last_month)
                dataSet.push(compAnalysesArray[i].package.gh_issues_closed_last_year)
                dataSet.push(compAnalysesArray[i].package.gh_issues_opened_last_month)
                dataSet.push(compAnalysesArray[i].package.gh_issues_opened_last_year)
                dataSet.push(compAnalysesArray[i].package.gh_prs_closed_last_month)
                dataSet.push(compAnalysesArray[i].package.gh_prs_closed_last_year)
                dataSet.push(compAnalysesArray[i].package.gh_prs_opened_last_month)
                dataSet.push(compAnalysesArray[i].package.gh_prs_opened_last_year)
            }
            this.buildComponentGrid(dataSet);
        }
    }

    buildComponentAnalyses = () => {
        let stackUri = this.stackApiUrl;
        let compAnalysesArray: Array<any>;
        let ecosystem: string = '';
        let component: string = '';
        let version: string = '';
        $('#compTable').hide();
        $('#stackbtn').on('click', () => {
            ecosystem = $("#ecosystem").val();
            component = $("#component").val();
            version = $("#version").val();
            $.ajax({
                url: stackUri + 'component-analyses/' + ecosystem + '/' + component + '/' + version,
                headers: {
                    'Content-Type': "application/json"
                },
                method: 'GET',
                success: response => {
                    compAnalysesArray = response.result.result.data;
                    $('#compTable').show();
                    this.formStackData(compAnalysesArray);
                },
                error: () => {
                    $('#compTable').hide();
                    console.log('Error fetching component analyses');
                }
            });
        });
    }

}